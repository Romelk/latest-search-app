/**
 * Visual Search Tool
 *
 * Finds visually similar products using Claude Vision style attribute extraction
 * and BigQuery metadata matching.
 *
 * Features:
 * - Upload image → extract style attributes → match products
 * - Product-based search (find items similar to a product)
 * - Similarity scoring algorithm (Category 40%, Style 30%, Color 20%, Occasion 10%)
 * - Excludes source product from results
 * - Cost tracking integration
 */

import axios from 'axios';
import { BigQuery } from '@google-cloud/bigquery';
import { config } from '../../config';
import { getClaudeVisionService } from '../../services/claudeVision.service';
import { getCostTrackingService } from '../../services/costTracking.service';
import type { ImageInput } from '../../services/claudeVision.service';
import type { Product } from '../../types';

export interface ColorInfo {
  color: string;
  hex: string;
  dominance?: number;
}

export interface DetectedAttributes {
  dominant_colors: ColorInfo[];
  style_category: string;
  clothing_items: string[];
  occasions: string[];
  formality_score: number;
  season?: string;
}

export interface MatchingProduct extends Product {
  similarity_score: number;
  match_reasons: string[];
}

export interface VisualSearchFilters {
  max_price?: number;
  min_price?: number;
  category?: string;
  color_match_mode?: 'exact' | 'complementary' | 'any';
  exclude_product_id?: string;
}

export interface VisualSearchResult {
  source_type: 'user_upload' | 'product_image';
  source_product?: {
    product_id: string;
    title: string;
    image_url: string;
  };
  detected_attributes: DetectedAttributes;
  matched_products: MatchingProduct[];
  total_matches: number;
}

export class VisualSearchTool {
  private static instance: VisualSearchTool;
  private visionService;
  private costTrackingService;
  private bigquery: BigQuery;

  private constructor() {
    this.visionService = getClaudeVisionService();
    this.costTrackingService = getCostTrackingService();
    this.bigquery = new BigQuery({
      projectId: config.gcp.projectId,
    });
  }

  static getInstance(): VisualSearchTool {
    if (!VisualSearchTool.instance) {
      VisualSearchTool.instance = new VisualSearchTool();
    }
    return VisualSearchTool.instance;
  }

  static getMetadata() {
    return {
      name: 'visual_search',
      displayName: 'Visual Search',
      description: 'Find similar products by uploading an image or from a product',
      icon: '🔍',
      estimatedCost: 0.03,
    };
  }

  /**
   * Download image from URL and convert to base64
   */
  private async downloadImageAsBase64(imageUrl: string): Promise<{ data: string; mediaType: ImageInput['mediaType'] }> {
    // Convert relative URLs to absolute URLs
    let fullUrl = imageUrl;
    if (imageUrl.startsWith('/')) {
      // Relative URL - convert to absolute using frontend URL
      const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
      fullUrl = `${frontendUrl}${imageUrl}`;
    }

    console.log(`📥 Downloading image from: ${fullUrl}`);

    try {
      const response = await axios.get(fullUrl, {
        responseType: 'arraybuffer',
        timeout: 15000, // 15 second timeout
        headers: {
          'User-Agent': 'NRF-Search-Visual-Tool/1.0',
        },
      });

      // Detect media type from Content-Type header
      const contentType = response.headers['content-type'] || 'image/jpeg';
      let mediaType: ImageInput['mediaType'] = 'image/jpeg';

      if (contentType.includes('png')) {
        mediaType = 'image/png';
      } else if (contentType.includes('webp')) {
        mediaType = 'image/webp';
      } else if (contentType.includes('gif')) {
        mediaType = 'image/gif';
      }

      // Convert buffer to base64
      const base64 = Buffer.from(response.data).toString('base64');

      console.log(`✅ Image downloaded: ${mediaType}, ${Math.round(base64.length / 1024)}KB`);

      return { data: base64, mediaType };
    } catch (error: any) {
      console.error(`❌ Failed to download image: ${error.message}`);
      throw new Error(`Failed to download image from URL: ${error.message}`);
    }
  }

  /**
   * Parse base64 data URL to extract image data and media type
   */
  private parseBase64DataUrl(dataUrl: string): { data: string; mediaType: ImageInput['mediaType'] } {
    // Format: data:image/jpeg;base64,/9j/4AAQSkZJRg...
    const match = dataUrl.match(/^data:image\/(jpeg|jpg|png|webp|gif);base64,(.+)$/);

    if (!match) {
      throw new Error('Invalid base64 data URL format');
    }

    const format = match[1] === 'jpg' ? 'jpeg' : match[1];
    const mediaType: ImageInput['mediaType'] = `image/${format}` as ImageInput['mediaType'];
    const data = match[2];

    return { data, mediaType };
  }

  /**
   * Extract style attributes from image using Claude Vision
   */
  private async extractStyleAttributes(image: ImageInput): Promise<DetectedAttributes> {
    console.log(`🔍 Extracting style attributes from image...`);

    const result = await this.visionService.extractStyleAttributes(image);

    // Parse the analysis result
    const analysis = result.analysis;

    // Map to our DetectedAttributes format
    const attributes: DetectedAttributes = {
      dominant_colors: (analysis.dominant_colors || []).map((color: string, index: number) => ({
        color: color,
        hex: analysis.color_hex_codes?.[index] || '#000000',
        dominance: index === 0 ? 0.6 : index === 1 ? 0.3 : 0.1,
      })),
      style_category: analysis.style_category || 'casual',
      clothing_items: analysis.clothing_items || [],
      occasions: analysis.occasions || [],
      formality_score: analysis.formality_score || 5,
      season: analysis.season || 'all-season',
    };

    console.log(`✅ Extracted attributes: ${attributes.dominant_colors.length} colors, style: ${attributes.style_category}`);

    return attributes;
  }

  /**
   * Query BigQuery for matching products
   */
  private async findMatchingProducts(
    attributes: DetectedAttributes,
    filters?: VisualSearchFilters,
    limit: number = 50
  ): Promise<Product[]> {
    console.log(`🔎 Searching for matching products in BigQuery...`);

    const whereClauses: string[] = [];
    const params: any = { limit };

    // Extract color names for matching
    const colorNames = attributes.dominant_colors.map((c) => c.color.toLowerCase());
    const primaryColors = colorNames.slice(0, 2); // Use top 2 colors

    // Build scoring conditions instead of hard filters (for flexible matching)
    const scoringConditions: string[] = [];

    // Color matching (fuzzy - match any of the primary colors)
    if (primaryColors.length > 0 && filters?.color_match_mode !== 'any') {
      const colorConditions = primaryColors.map((color) => {
        // Handle multi-word colors like "navy blue" and variations
        const colorWords = color.split(' ');
        const colorPatterns = colorWords.map((word) => `LOWER(color) LIKE '%${word}%'`);
        return `(${colorPatterns.join(' OR ')})`;
      });
      scoringConditions.push(`(${colorConditions.join(' OR ')})`);
    }

    // Style matching - DISABLED: style column is empty in current dataset
    // if (attributes.style_category && attributes.style_category !== 'unknown') {
    //   scoringConditions.push('LOWER(style) = @style');
    //   params.style = attributes.style_category.toLowerCase();
    // }

    // Category matching (detected clothing items) - more flexible
    if (attributes.clothing_items.length > 0) {
      const categoryConditions = attributes.clothing_items.map((item) => {
        // Extract key category words (e.g., "denim button-up shirt" -> "shirt", "denim")
        const words = item.toLowerCase().split(/[\s-]+/);
        const categoryWords = words.filter(w =>
          w.length > 3 && !['with', 'the', 'and', 'for'].includes(w)
        );

        if (categoryWords.length === 0) return null;

        const patterns = categoryWords.map(word => `LOWER(category) LIKE '%${word}%' OR LOWER(raw_category) LIKE '%${word}%'`);
        return `(${patterns.join(' OR ')})`;
      }).filter(Boolean);

      if (categoryConditions.length > 0) {
        scoringConditions.push(`(${categoryConditions.join(' OR ')})`);
      }
    }

    // Occasion matching (flexible - checks if any word from detected occasions matches any tag)
    if (attributes.occasions.length > 0) {
      // Extract key words from occasions (e.g., "casual outing" -> "casual", "weekend wear" -> "weekend")
      const occasionKeywords = new Set<string>();
      attributes.occasions.forEach((occasion) => {
        const words = occasion.toLowerCase().split(' ');
        words.forEach((word) => {
          // Add meaningful words (skip common words like "and", "the", "for")
          if (word.length > 3 && !['with', 'from', 'that', 'this', 'wear', 'outing'].includes(word)) {
            occasionKeywords.add(word);
          }
        });
      });

      if (occasionKeywords.size > 0) {
        // Build flexible occasion matching: any occasion tag contains any keyword
        const occasionConditions = Array.from(occasionKeywords).map((keyword, index) => {
          const paramName = `occasion_${index}`;
          params[paramName] = keyword;
          return `EXISTS (SELECT 1 FROM UNNEST(occasion_tags) AS tag WHERE LOWER(tag) = @${paramName})`;
        });
        scoringConditions.push(`(${occasionConditions.join(' OR ')})`);
      }
    }

    // Require at least ONE scoring condition to match (OR logic instead of AND)
    if (scoringConditions.length > 0) {
      whereClauses.push(`(${scoringConditions.join(' OR ')})`);
    }

    // Price filters
    if (filters?.min_price !== undefined) {
      whereClauses.push('price >= @min_price');
      params.min_price = filters.min_price;
    }
    if (filters?.max_price !== undefined) {
      whereClauses.push('price <= @max_price');
      params.max_price = filters.max_price;
    }

    // Exclude source product
    if (filters?.exclude_product_id) {
      whereClauses.push('product_id != @exclude_product_id');
      params.exclude_product_id = filters.exclude_product_id;
    }

    // Filter out non-clothing accessories
    const nonClothingCategories = [
      'deodorant',
      'perfume and body mist',
      'hair gels and wax',
      'socks',
      'belts',
      'watches',
      'face wash and cleanser',
      'sunscreen',
      'lip balm',
      'hair accessories',
      'mobile pouch',
      'handbags',
      'wallets',
      'backpacks',
    ];
    const categoryExclusions = nonClothingCategories.map((cat) => `LOWER(category) != '${cat}'`).join(' AND ');

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')} AND ${categoryExclusions}` : `WHERE ${categoryExclusions}`;

    const sqlQuery = `
      SELECT
        product_id,
        title,
        brand,
        price,
        image_url,
        category,
        color,
        size,
        fit,
        occasion_tags,
        style,
        description,
        COALESCE(rating, 0) as rating
      FROM \`${config.gcp.projectId}.${config.bigquery.dataset}.${config.bigquery.table}\`
      ${whereClause}
      ORDER BY rating DESC, price ASC
      LIMIT @limit
    `;

    console.log(`📊 Query WHERE: ${whereClause}`);

    try {
      const [rows] = await this.bigquery.query({
        query: sqlQuery,
        params,
        location: 'US',
      });

      console.log(`✅ Found ${rows.length} matching products`);
      return rows as Product[];
    } catch (error: any) {
      console.error('❌ BigQuery error:', error.message);
      // Return mock products on error
      return this.getMockMatchingProducts(attributes, filters);
    }
  }

  /**
   * Calculate similarity scores for products
   */
  private rankProductsBySimilarity(products: Product[], attributes: DetectedAttributes): MatchingProduct[] {
    console.log(`🎯 Calculating similarity scores for ${products.length} products...`);

    return products
      .map((product) => {
        let score = 0;
        const reasons: string[] = [];

        // Category match (40% weight) - most important
        if (attributes.clothing_items.length > 0) {
          const categoryMatch = attributes.clothing_items.some((item) =>
            product.category.toLowerCase().includes(item.toLowerCase())
          );
          if (categoryMatch) {
            score += 0.4;
            reasons.push('Category match');
          }
        }

        // Style match (30% weight)
        if (product.style?.toLowerCase() === attributes.style_category.toLowerCase()) {
          score += 0.3;
          reasons.push('Style match');
        } else if (product.style && attributes.style_category !== 'unknown') {
          // Partial match for related styles (e.g., "casual" and "smart casual")
          if (
            (product.style.toLowerCase().includes('casual') && attributes.style_category.toLowerCase().includes('casual')) ||
            (product.style.toLowerCase().includes('formal') && attributes.style_category.toLowerCase().includes('formal'))
          ) {
            score += 0.15; // Half points for partial style match
            reasons.push('Related style');
          }
        }

        // Color match (20% weight)
        const productColorLower = product.color?.toLowerCase() || '';
        const colorMatch = attributes.dominant_colors.some((c) => {
          const colorWords = c.color.toLowerCase().split(' ');
          return colorWords.some((word) => productColorLower.includes(word) || word.includes(productColorLower));
        });
        if (colorMatch) {
          score += 0.2;
          reasons.push(`${product.color} color match`);
        }

        // Occasion match (10% weight)
        if (product.occasion_tags && attributes.occasions.length > 0) {
          const occasionOverlap = product.occasion_tags.filter((tag) =>
            attributes.occasions.some((o) => o.toLowerCase() === tag.toLowerCase())
          );
          if (occasionOverlap.length > 0) {
            score += 0.1 * (occasionOverlap.length / attributes.occasions.length);
            reasons.push('Occasion match');
          }
        }

        // Convert to percentage (0-100)
        const percentageScore = Math.round(score * 100);

        return {
          ...product,
          similarity_score: percentageScore,
          match_reasons: reasons,
        };
      })
      .sort((a, b) => b.similarity_score - a.similarity_score);
  }

  /**
   * Mock matching products for fallback
   */
  private getMockMatchingProducts(attributes: DetectedAttributes, filters?: VisualSearchFilters): Product[] {
    const mockProducts: Product[] = [
      {
        product_id: 'SKU001',
        title: 'Blue Formal Shirt',
        brand: 'Peter England',
        price: 2499,
        image_url: 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf?w=400&h=600&fit=crop&q=80',
        category: 'shirt',
        color: 'blue',
        size: '42',
        fit: 'regular',
        occasion_tags: ['formal', 'office'],
        style: 'formal',
        description: 'Classic blue formal shirt with regular fit',
      },
      {
        product_id: 'SKU004',
        title: 'White Cotton Shirt',
        brand: 'Arrow',
        price: 2799,
        image_url: 'https://images.unsplash.com/photo-1620012253295-c15cc3e65df4?w=400&h=600&fit=crop&q=80',
        category: 'shirt',
        color: 'white',
        size: '42',
        fit: 'slim',
        occasion_tags: ['formal', 'wedding'],
        style: 'formal',
        description: 'Classic white cotton shirt with slim fit',
      },
      {
        product_id: 'SKU005',
        title: 'Grey Comfort Fit Chinos',
        brand: 'Allen Solly',
        price: 3199,
        image_url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=400&h=600&fit=crop&q=80',
        category: 'trousers',
        color: 'grey',
        size: '42',
        fit: 'comfort',
        occasion_tags: ['casual', 'smart-casual'],
        style: 'casual',
        description: 'Comfortable grey chinos for everyday wear',
      },
    ];

    // Apply exclusion filter
    return mockProducts.filter((p) => p.product_id !== filters?.exclude_product_id).slice(0, 10);
  }

  /**
   * Main search method - supports both user uploads and product-based search
   */
  async search(params: {
    sessionId: string;
    imageDataUrl?: string;
    productId?: string;
    productImageUrl?: string;
    filters?: VisualSearchFilters;
    limit?: number;
  }): Promise<{
    result: VisualSearchResult;
    usage: {
      input_tokens: number;
      output_tokens: number;
      cost_usd: number;
    };
  }> {
    const { sessionId, imageDataUrl, productId, productImageUrl, limit = 12 } = params;

    console.log(`\n🔍 Visual Search: Starting search for session ${sessionId}`);

    let image: ImageInput;
    let sourceType: 'user_upload' | 'product_image' = 'user_upload';
    let sourceProduct: { product_id: string; title: string; image_url: string } | undefined;

    // Create mutable filters object
    let searchFilters: VisualSearchFilters = { ...params.filters };

    // Determine image source
    if (imageDataUrl) {
      // User uploaded image
      const parsed = this.parseBase64DataUrl(imageDataUrl);
      image = parsed;
      console.log(`📸 Source: User upload (${parsed.mediaType})`);
    } else if (productImageUrl) {
      // Product-based search
      const downloaded = await this.downloadImageAsBase64(productImageUrl);
      image = downloaded;
      sourceType = 'product_image';
      sourceProduct = {
        product_id: productId || 'unknown',
        title: 'Source Product',
        image_url: productImageUrl,
      };
      console.log(`🛍️  Source: Product image (${productId})`);

      // Auto-exclude source product
      searchFilters.exclude_product_id = productId;
    } else {
      throw new Error('Either imageDataUrl or productImageUrl must be provided');
    }

    // Step 1: Extract style attributes using Claude Vision
    const visionResult = await this.visionService.extractStyleAttributes(image);
    const detectedAttributes: DetectedAttributes = {
      dominant_colors: (visionResult.analysis.dominant_colors || []).map((color: string, index: number) => ({
        color: color,
        hex: visionResult.analysis.color_hex_codes?.[index] || '#000000',
        dominance: index === 0 ? 0.6 : index === 1 ? 0.3 : 0.1,
      })),
      style_category: visionResult.analysis.style_category || 'casual',
      clothing_items: visionResult.analysis.clothing_items || [],
      occasions: visionResult.analysis.occasions || [],
      formality_score: visionResult.analysis.formality_score || 5,
      season: visionResult.analysis.season || 'all-season',
    };

    // Step 2: Find matching products in BigQuery
    const products = await this.findMatchingProducts(detectedAttributes, searchFilters, 50);

    // Step 3: Calculate similarity scores
    const rankedProducts = this.rankProductsBySimilarity(products, detectedAttributes);

    // Step 4: Take top N products
    const topMatches = rankedProducts.slice(0, limit);

    // Step 5: Record usage in cost tracking
    await this.costTrackingService.recordUsage({
      session_id: sessionId,
      tool_name: 'visual_search',
      cost_usd: visionResult.usage.cost_usd,
      image_count: 1,
      input_tokens: visionResult.usage.input_tokens,
      output_tokens: visionResult.usage.output_tokens,
      metadata: {
        source_type: sourceType,
        detected_colors: detectedAttributes.dominant_colors.map((c) => c.color),
        detected_style: detectedAttributes.style_category,
        total_matches: topMatches.length,
      },
    });

    console.log(`✅ Visual Search complete: Found ${topMatches.length} similar products`);
    console.log(`💰 Cost: $${visionResult.usage.cost_usd.toFixed(4)}`);

    return {
      result: {
        source_type: sourceType,
        source_product: sourceProduct,
        detected_attributes: detectedAttributes,
        matched_products: topMatches,
        total_matches: topMatches.length,
      },
      usage: visionResult.usage,
    };
  }
}

export default VisualSearchTool.getInstance();
