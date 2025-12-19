import { BigQuery } from '@google-cloud/bigquery';
import { config } from '../config';
import { Product, SearchFilters } from '../types';

let bigquery: BigQuery | null = null;

export function getBigQuery(): BigQuery {
  if (!bigquery) {
    bigquery = new BigQuery({
      projectId: config.gcp.projectId,
      location: 'US', // BigQuery dataset location (must match dataset location)
    });
  }
  return bigquery;
}

/**
 * Enhanced searchProducts - Hybrid approach
 *
 * Philosophy:
 * - Query text IS searched (in title, description, category, raw_category)
 * - Filters (category, gender, color, occasion) are STRICT for precision
 * - If no filters AND no query matches → return empty (prevents false positives)
 * - Relevance is based on: text match quality > rating > price
 */
export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  limit: number = 20
): Promise<Product[]> {
  try {
    const bq = getBigQuery();
    const dataset = config.bigquery.dataset;
    const table = config.bigquery.table;

    const whereClauses: string[] = [];
    const queryParams: Record<string, any> = { limit };

    // ========================================
    // TEXT SEARCH ON QUERY (if provided)
    // ========================================
    if (query && query.trim()) {
      const cleanQuery = query.toLowerCase().trim();

      // Search across multiple fields for better recall
      whereClauses.push(`(
        LOWER(title) LIKE CONCAT('%', @query_term, '%') OR
        LOWER(description) LIKE CONCAT('%', @query_term, '%') OR
        LOWER(category) LIKE CONCAT('%', @query_term, '%') OR
        LOWER(raw_category) LIKE CONCAT('%', @query_term, '%')
      )`);
      queryParams.query_term = cleanQuery;
    }

    // ========================================
    // EXTRACT GENDER FROM QUERY (if present)
    // ========================================
    const genderFromQuery = extractGender(query);
    if (genderFromQuery && !filters?.gender) {
      whereClauses.push('LOWER(gender) = @gender');
      queryParams.gender = genderFromQuery;
    }

    // ========================================
    // FILTERS (All are strict/exact)
    // ========================================

    // Category (exact match after normalization)
    if (filters?.category) {
      const normalizedCategory = normalizeCategoryName(filters.category);
      whereClauses.push('LOWER(category) = @category');
      queryParams.category = normalizedCategory;
    }

    // Gender (overrides extracted gender)
    if (filters?.gender) {
      whereClauses.push('LOWER(gender) = @gender_filter');
      queryParams.gender_filter = filters.gender.toLowerCase();
    }

    // Color (exact match)
    if (filters?.color) {
      whereClauses.push('LOWER(color) = @color');
      queryParams.color = filters.color.toLowerCase();
    }

    // Brand (exact match) - handle both string and array
    if (filters?.brand) {
      const brandValue = Array.isArray(filters.brand) ? filters.brand[0] : filters.brand;
      if (brandValue && typeof brandValue === 'string') {
        whereClauses.push('LOWER(brand) = @brand');
        queryParams.brand = brandValue.toLowerCase();
      }
    }

    // Occasion (ANY match in array)
    if (filters?.occasion && filters.occasion.length > 0) {
      // Flatten occasion array in case it's nested (e.g., [['formal']] → ['formal'])
      const flattenedOccasions = filters.occasion.flat().filter(occ => typeof occ === 'string');

      // Map user-friendly occasions to database tags
      const occasionMapping: Record<string, string[]> = {
        'interview': ['formal', 'work'],
        'wedding': ['formal', 'party'],
        'date': ['party', 'casual'],
      };

      if (flattenedOccasions.length > 0) {
        const mappedOccasions = flattenedOccasions.flatMap(occ => {
          const mapped = occasionMapping[occ.toLowerCase()];
          return mapped || [occ]; // Use mapping or original value
        });

        const occasionConditions = mappedOccasions.map((occ, idx) => {
          queryParams[`occasion${idx}`] = occ.toLowerCase();
          return `EXISTS (SELECT 1 FROM UNNEST(occasion_tags) AS tag WHERE LOWER(tag) = @occasion${idx})`;
        });
        whereClauses.push(`(${occasionConditions.join(' OR ')})`);
      }
    }

    // Price range
    if (filters?.price_min !== undefined) {
      whereClauses.push('price >= @price_min');
      queryParams.price_min = filters.price_min;
    }
    if (filters?.price_max !== undefined) {
      whereClauses.push('price <= @price_max');
      queryParams.price_max = filters.price_max;
    }

    // Style - DISABLED: style column is empty in current dataset
    // if (filters?.style) {
    //   whereClauses.push('LOWER(style) = @style');
    //   queryParams.style = filters.style.toLowerCase();
    // }

    // Build WHERE clause
    const whereClause = whereClauses.length > 0
      ? `WHERE ${whereClauses.join(' AND ')}`
      : '';

    // ========================================
    // SAFETY CHECK: Prevent returning all products
    // ========================================
    if (whereClauses.length === 0) {
      console.log('⚠️  No search criteria provided (no query, no filters) - returning empty results to prevent false positives');
      return [];
    }

    // ========================================
    // QUERY with RELEVANCE SORTING
    // ========================================
    const sqlQuery = `
      SELECT
        product_id,
        title,
        brand,
        price,
        image_url,
        category,
        raw_category,
        gender,
        color,
        size,
        fit,
        occasion_tags,
        style,
        description,
        rating,
        rating_count,
        original_price
      FROM \`${config.gcp.projectId}.${dataset}.${table}\`
      ${whereClause}
      ORDER BY
        CASE WHEN rating IS NOT NULL THEN rating ELSE 0 END DESC,
        price ASC
      LIMIT @limit
    `;

    const queryOptions = {
      query: sqlQuery,
      params: queryParams,
    };

    console.log('🔍 BigQuery Search:', {
      query,
      filters,
      whereClauses,
      params: queryParams,
    });

    const [rows] = await bq.query(queryOptions);

    console.log(`✅ Found ${rows.length} products`);

    return rows as Product[];
  } catch (error) {
    console.error('❌ Error querying BigQuery:', error);
    throw error;
  }
}

/**
 * Extract gender from query string
 * Uses word boundaries to avoid false matches (e.g., "women" containing "men")
 */
function extractGender(query: string): string | null {
  const lowerQuery = query.toLowerCase();

  // Check for female keywords FIRST (to avoid "women" matching "men")
  if (/\b(women|woman|women's|female|girl|girl's|girls|ladies)\b/i.test(lowerQuery)) {
    return 'women';
  }

  // Then check for male keywords
  if (/\b(men|man|men's|male|boy|boy's|boys)\b/i.test(lowerQuery)) {
    return 'men';
  }

  return null;
}

/**
 * Normalize category name to match BigQuery data
 */
function normalizeCategoryName(category: string): string {
  const categoryMap: Record<string, string> = {
    'pant': 'bottom',
    'pants': 'bottom',
    'trouser': 'bottom',
    'trousers': 'bottom',
    'bottom': 'bottom',
    'bottoms': 'bottom',

    'shirt': 'top',
    'shirts': 'top',
    'blouse': 'top',
    'top': 'top',
    'tops': 'top',

    'jean': 'denim',
    'jeans': 'denim',
    'denim': 'denim',

    'dress': 'one_piece',
    'dresses': 'one_piece',
    'gown': 'one_piece',
    'romper': 'one_piece',
    'jumpsuit': 'one_piece',
    'one_piece': 'one_piece',
    'one piece': 'one_piece',

    'jacket': 'outerwear',
    'jackets': 'outerwear',
    'blazer': 'outerwear',
    'coat': 'outerwear',
    'outerwear': 'outerwear',
  };

  const normalized = category.toLowerCase().trim();
  return categoryMap[normalized] || normalized;
}

/**
 * Get outfit recommendations for a product
 */
export async function getOutfitRecommendations(
  productId: string
): Promise<any[]> {
  try {
    const bq = getBigQuery();
    const dataset = config.bigquery.dataset;
    const outfitsTable = 'outfits';

    const sqlQuery = `
      SELECT *
      FROM \`${config.gcp.projectId}.${dataset}.${outfitsTable}\`
      WHERE EXISTS (
        SELECT 1
        FROM UNNEST(items) AS item
        WHERE item.product_id = @product_id
      )
      LIMIT 5
    `;

    const [rows] = await bq.query({
      query: sqlQuery,
      params: { product_id: productId },
    });

    return rows;
  } catch (error) {
    console.error('❌ Error fetching outfit recommendations:', error);
    return [];
  }
}

/**
 * Get products by IDs
 */
export async function getProductsByIds(productIds: string[]): Promise<Product[]> {
  try {
    const bq = getBigQuery();
    const dataset = config.bigquery.dataset;
    const table = config.bigquery.table;

    const sqlQuery = `
      SELECT *
      FROM \`${config.gcp.projectId}.${dataset}.${table}\`
      WHERE product_id IN UNNEST(@product_ids)
    `;

    const [rows] = await bq.query({
      query: sqlQuery,
      params: { product_ids: productIds },
    });

    return rows as Product[];
  } catch (error) {
    console.error('❌ Error fetching products by IDs:', error);
    return [];
  }
}

// Mock data function (keep for fallback)
function getMockProducts(query: string, filters?: SearchFilters, limit: number = 20): Product[] {
  return [];
}

export async function getDealsProducts(limit: number = 10): Promise<Product[]> {
  return searchProducts('', { price_max: 1500 }, limit);
}

export async function getTopSellingProducts(limit: number = 10): Promise<Product[]> {
  return searchProducts('', {}, limit);
}
