"""
Database layer for Alex Fashion Stylist
Handles SQLite connection, table creation, and trend data operations
"""
import sqlite3
import json
from typing import List, Optional, Dict, Any
from datetime import datetime


DB_PATH = "alex_trends.db"


def get_db_connection() -> sqlite3.Connection:
    """
    Get a connection to the SQLite database.
    Returns a connection with row_factory set to sqlite3.Row for dict-like access.
    """
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn


def init_db() -> None:
    """
    Initialize the database by creating the trends table if it doesn't exist.
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trends (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            season TEXT NOT NULL,
            garment_types TEXT NOT NULL,
            gender_focus TEXT NOT NULL,
            style_tags TEXT NOT NULL,
            colour_palette TEXT NOT NULL,
            fit_notes TEXT,
            contexts TEXT NOT NULL,
            formality TEXT NOT NULL,
            climate_suitability TEXT NOT NULL,
            region TEXT NOT NULL,
            key_items TEXT NOT NULL,
            avoid_for_body_types TEXT NOT NULL,
            source_title TEXT NOT NULL,
            source_url TEXT NOT NULL,
            published_at TEXT NOT NULL,
            confidence TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    """)

    conn.commit()
    conn.close()
    print(f"Database initialized at {DB_PATH}")


def insert_trends(trends: List[Dict[str, Any]]) -> int:
    """
    Bulk insert trends into the database.

    Args:
        trends: List of trend dictionaries matching the trend schema

    Returns:
        Number of trends inserted
    """
    if not trends:
        return 0

    conn = get_db_connection()
    cursor = conn.cursor()

    inserted_count = 0

    for trend in trends:
        try:
            # Convert list fields to JSON strings
            garment_types_json = json.dumps(trend.get("garment_types", []))
            style_tags_json = json.dumps(trend.get("style_tags", []))
            colour_palette_json = json.dumps(trend.get("colour_palette", []))
            contexts_json = json.dumps(trend.get("contexts", []))
            climate_suitability_json = json.dumps(trend.get("climate_suitability", []))
            key_items_json = json.dumps(trend.get("key_items", []))
            avoid_for_body_types_json = json.dumps(trend.get("avoid_for_body_types", []))

            cursor.execute("""
                INSERT INTO trends (
                    name, season, garment_types, gender_focus, style_tags,
                    colour_palette, fit_notes, contexts, formality,
                    climate_suitability, region, key_items, avoid_for_body_types,
                    source_title, source_url, published_at, confidence
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                trend.get("name", ""),
                trend.get("season", "All season"),
                garment_types_json,
                trend.get("gender_focus", "all"),
                style_tags_json,
                colour_palette_json,
                trend.get("fit_notes", ""),
                contexts_json,
                trend.get("formality", "casual"),
                climate_suitability_json,
                trend.get("region", "global"),
                key_items_json,
                avoid_for_body_types_json,
                trend.get("source_title", ""),
                trend.get("source_url", ""),
                trend.get("published_at", datetime.now().isoformat()),
                trend.get("confidence", "medium")
            ))
            inserted_count += 1
        except Exception as e:
            print(f"Error inserting trend '{trend.get('name', 'unknown')}': {e}")
            continue

    conn.commit()
    conn.close()

    print(f"Inserted {inserted_count} trends into database")
    return inserted_count


def get_recent_trends(
    limit: int = 40,
    region: Optional[str] = None,
    contexts: Optional[List[str]] = None
) -> List[Dict[str, Any]]:
    """
    Query recent trends from the database with optional filters.

    Args:
        limit: Maximum number of trends to return (default 40)
        region: Optional region filter (e.g., "India", "global")
        contexts: Optional list of context filters (e.g., ["office", "party"])

    Returns:
        List of trend dictionaries with JSON fields parsed
    """
    conn = get_db_connection()
    cursor = conn.cursor()

    # Build query with filters
    query = "SELECT * FROM trends WHERE 1=1"
    params = []

    if region:
        query += " AND (region = ? OR region = 'global')"
        params.append(region)

    # For contexts, we need to check if any of the provided contexts appear in the JSON array
    # SQLite doesn't have great JSON support, so we'll do a simple LIKE check
    if contexts:
        context_conditions = []
        for ctx in contexts:
            context_conditions.append("contexts LIKE ?")
            params.append(f'%"{ctx}"%')
        query += " AND (" + " OR ".join(context_conditions) + ")"

    query += " ORDER BY created_at DESC LIMIT ?"
    params.append(limit)

    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()

    # Convert rows to dictionaries and parse JSON fields
    trends = []
    for row in rows:
        trend = dict(row)

        # Parse JSON fields
        try:
            trend["garment_types"] = json.loads(trend["garment_types"])
            trend["style_tags"] = json.loads(trend["style_tags"])
            trend["colour_palette"] = json.loads(trend["colour_palette"])
            trend["contexts"] = json.loads(trend["contexts"])
            trend["climate_suitability"] = json.loads(trend["climate_suitability"])
            trend["key_items"] = json.loads(trend["key_items"])
            trend["avoid_for_body_types"] = json.loads(trend["avoid_for_body_types"])
        except json.JSONDecodeError as e:
            print(f"Error parsing JSON for trend {trend['id']}: {e}")
            continue

        trends.append(trend)

    return trends


def get_trend_count() -> int:
    """
    Get the total number of trends in the database.

    Returns:
        Total trend count
    """
    conn = get_db_connection()
    cursor = conn.cursor()
    cursor.execute("SELECT COUNT(*) as count FROM trends")
    count = cursor.fetchone()["count"]
    conn.close()
    return count


if __name__ == "__main__":
    # Initialize database when run directly
    init_db()
    print(f"Current trend count: {get_trend_count()}")
