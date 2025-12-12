"""
Fashion trend ingestion script for Alex Fashion Stylist
Fetches fashion articles and extracts trends using Claude LLM
"""
import argparse
import json
import sys
from typing import List, Dict, Any
from datetime import datetime

try:
    import requests
    from bs4 import BeautifulSoup
except ImportError:
    print("Missing dependencies. Install with: pip install requests beautifulsoup4")
    sys.exit(1)

from db import init_db, insert_trends, get_trend_count
from llm_client import call_claude_json, ClaudeClientError
from prompts import build_trend_ingestion_prompt, get_trend_ingestion_system_prompt


# ============================================================================
# Configuration: Fashion Article Sources
# ============================================================================

SOURCES = [
    {
        "title": "Vogue Spring 2026 Trends",
        "url": "https://www.vogue.com/fashion/trends/spring-2026"
    },
    {
        "title": "GQ Men's Fashion Trends",
        "url": "https://www.gq.com/style/fashion-trends"
    },
    {
        "title": "Harper's Bazaar Seasonal Guide",
        "url": "https://www.harpersbazaar.com/fashion/trends/"
    }
]


# ============================================================================
# Demo Mode: Hardcoded Sample Articles
# ============================================================================

DEMO_ARTICLES = [
    {
        "title": "Spring 2026: The Return of Sophisticated Minimalism",
        "url": "https://demo.fashion/spring-2026-minimalism",
        "content": """
        Spring 2026 marks the triumphant return of sophisticated minimalism, with designers embracing
        clean lines and luxurious fabrics. Wide-leg trousers in premium cotton and linen are
        dominating runways, shown in earthy neutrals like sand, terracotta, and sage green.

        The key look pairs these relaxed trousers with fitted knit tops or silk blouses, creating
        a balanced silhouette perfect for both office and evening occasions. Footwear leans toward
        comfortable elegance: leather loafers, minimal sneakers, and low-heeled mules.

        Accessories are intentionally sparse - a structured leather tote, delicate gold jewelry,
        and perhaps a silk scarf. The colour palette revolves around warm neutrals with occasional
        pops of rust orange or deep burgundy.

        This trend works well for warm and temperate climates and suits most body types, though
        those with shorter frames should ensure trousers are properly hemmed to avoid overwhelming
        the silhouette. The formality ranges from smart casual to semi-formal, making it incredibly
        versatile for modern professionals.
        """
    },
    {
        "title": "Bold Prints and Structured Silhouettes for SS2026",
        "url": "https://demo.fashion/bold-prints-ss2026",
        "content": """
        Spring/Summer 2026 brings a celebration of bold geometric prints and architectural silhouettes.
        Oversized blazers with strong shoulders are paired with slim-fit trousers or midi skirts
        in contrasting patterns.

        The colour story is vibrant: cobalt blue, fuchsia pink, electric yellow, and emerald green
        dominate the palette. Fabrics lean toward structured materials - cotton poplin, linen blends,
        and lightweight wool.

        For footwear, chunky loafers and block-heel sandals provide both comfort and statement-making
        style. The look is completed with geometric earrings, structured crossbody bags, and sleek
        sunglasses.

        This trend is ideal for fashion-forward individuals comfortable with attention. It works for
        creative offices, parties, and social events. The formality is smart casual to semi-formal.
        Best suited for warm climates and those who enjoy bold self-expression.

        Key pieces include: oversized blazer in bold print, slim ankle-length trousers, graphic
        print midi skirt, and block-heel sandals.
        """
    },
    {
        "title": "Traditional Fusion: Modern Indian Ethnic Wear",
        "url": "https://demo.fashion/indian-ethnic-modern",
        "content": """
        The new wave of Indian ethnic fashion blends traditional craftsmanship with contemporary
        cuts. Kurtas are now seen in unconventional silhouettes - asymmetric hems, cape sleeves,
        and crop lengths paired with palazzo pants or dhoti-style bottoms.

        Sarees are being draped in modern ways, with pre-stitched options and innovative blouse
        designs featuring cold shoulders, halter necks, and jacket-style cuts. Fabrics range from
        handloom cotton and khadi for daily wear to silk and organza for festive occasions.

        The colour palette includes both traditional jewel tones (emerald, ruby red, sapphire blue)
        and contemporary pastels (powder pink, mint, lavender). Block printing, Chikankari, and
        minimal embroidery are preferred over heavy embellishments.

        This trend is perfect for office wear, festivals, weddings as a guest, and cultural events.
        It suits all body types and works in both warm and humid climates. Footwear includes juttis,
        kolhapuris, and block-heel sandals.

        Accessories are thoughtfully chosen: statement jhumkas or chandbalis, potli bags or
        structured clutches, and minimal bangles. Hair is typically styled in loose waves or
        sleek buns with fresh flowers.
        """
    }
]


# ============================================================================
# Article Fetching Functions
# ============================================================================

def fetch_article_html(url: str, timeout: int = 10) -> str:
    """
    Fetch HTML content from a URL.

    Args:
        url: Article URL to fetch
        timeout: Request timeout in seconds

    Returns:
        HTML content as string

    Raises:
        Exception: If request fails
    """
    headers = {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    }
    response = requests.get(url, headers=headers, timeout=timeout)
    response.raise_for_status()
    return response.text


def strip_html_to_text(html: str) -> str:
    """
    Convert HTML to plain text using BeautifulSoup.

    Args:
        html: HTML content

    Returns:
        Plain text content
    """
    soup = BeautifulSoup(html, 'html.parser')

    # Remove script and style elements
    for script in soup(["script", "style", "nav", "footer", "header"]):
        script.decompose()

    # Get text and clean it up
    text = soup.get_text(separator='\n')
    lines = [line.strip() for line in text.splitlines() if line.strip()]
    clean_text = '\n'.join(lines)

    return clean_text


# ============================================================================
# Trend Extraction Functions
# ============================================================================

def extract_trends_from_article(
    article_text: str,
    source_title: str,
    source_url: str
) -> List[Dict[str, Any]]:
    """
    Use Claude to extract fashion trends from article text.

    Args:
        article_text: The article content
        source_title: Title of the article
        source_url: URL of the article

    Returns:
        List of trend dictionaries
    """
    try:
        # Build prompts
        system_prompt = get_trend_ingestion_system_prompt()
        user_prompt = build_trend_ingestion_prompt(article_text, source_title, source_url)

        # Call Claude
        print(f"  Calling Claude to extract trends from '{source_title}'...")
        response = call_claude_json(system_prompt, user_prompt, max_tokens=4000)

        # Parse JSON response
        trends = json.loads(response)

        if not isinstance(trends, list):
            print(f"  Warning: Expected JSON array, got {type(trends)}. Wrapping in list.")
            trends = [trends] if isinstance(trends, dict) else []

        print(f"  Extracted {len(trends)} trends")
        return trends

    except json.JSONDecodeError as e:
        print(f"  Error: Failed to parse JSON response: {e}")
        print(f"  Response preview: {response[:200]}...")
        return []
    except ClaudeClientError as e:
        print(f"  Error: Claude API error: {e}")
        return []
    except Exception as e:
        print(f"  Error: Unexpected error: {e}")
        return []


# ============================================================================
# Main Ingestion Logic
# ============================================================================

def ingest_trends_demo() -> int:
    """
    Ingest trends in demo mode using hardcoded articles.

    Returns:
        Total number of trends inserted
    """
    print("\n" + "="*70)
    print("DEMO MODE: Using hardcoded sample articles")
    print("="*70 + "\n")

    all_trends = []

    for i, article in enumerate(DEMO_ARTICLES, 1):
        print(f"Processing demo article {i}/{len(DEMO_ARTICLES)}: {article['title']}")

        trends = extract_trends_from_article(
            article['content'],
            article['title'],
            article['url']
        )

        all_trends.extend(trends)
        print()

    # Insert all trends into database
    if all_trends:
        print(f"Inserting {len(all_trends)} trends into database...")
        count = insert_trends(all_trends)
        return count
    else:
        print("No trends extracted.")
        return 0


def ingest_trends_live() -> int:
    """
    Ingest trends in live mode by fetching articles from URLs.

    Returns:
        Total number of trends inserted
    """
    print("\n" + "="*70)
    print("LIVE MODE: Fetching articles from URLs")
    print("="*70 + "\n")

    all_trends = []

    for i, source in enumerate(SOURCES, 1):
        print(f"Processing source {i}/{len(SOURCES)}: {source['title']}")

        try:
            # Fetch HTML
            print(f"  Fetching {source['url']}...")
            html = fetch_article_html(source['url'])

            # Convert to text
            article_text = strip_html_to_text(html)
            print(f"  Extracted {len(article_text)} characters of text")

            # Extract trends
            trends = extract_trends_from_article(
                article_text,
                source['title'],
                source['url']
            )

            all_trends.extend(trends)

        except Exception as e:
            print(f"  Error processing source: {e}")
            continue

        print()

    # Insert all trends into database
    if all_trends:
        print(f"Inserting {len(all_trends)} trends into database...")
        count = insert_trends(all_trends)
        return count
    else:
        print("No trends extracted.")
        return 0


# ============================================================================
# CLI Entry Point
# ============================================================================

def main():
    """Main entry point for trend ingestion script"""
    parser = argparse.ArgumentParser(
        description="Ingest fashion trends from articles into the database"
    )
    parser.add_argument(
        '--demo',
        action='store_true',
        help="Run in demo mode with hardcoded articles (no internet required)"
    )

    args = parser.parse_args()

    # Initialize database
    print("Initializing database...")
    init_db()
    print(f"Current trend count: {get_trend_count()}\n")

    # Run ingestion
    if args.demo:
        trends_added = ingest_trends_demo()
    else:
        trends_added = ingest_trends_live()

    # Summary
    print("\n" + "="*70)
    print(f"SUMMARY: Added {trends_added} new trends")
    print(f"Total trends in database: {get_trend_count()}")
    print("="*70)


if __name__ == "__main__":
    main()
