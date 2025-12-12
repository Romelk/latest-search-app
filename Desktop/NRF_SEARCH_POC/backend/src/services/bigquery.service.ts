import { BigQuery } from '@google-cloud/bigquery';
import { config } from '../config';
import { Product, SearchFilters } from '../types';

let bigquery: BigQuery | null = null;

export function getBigQuery(): BigQuery {
  if (!bigquery) {
    bigquery = new BigQuery({
      projectId: config.gcp.projectId,
    });
  }
  return bigquery;
}

export async function searchProducts(
  query: string,
  filters?: SearchFilters,
  limit: number = 20
): Promise<Product[]> {
  try {
    const bq = getBigQuery();
    const dataset = config.bigquery.dataset;
    const table = config.bigquery.table;

    // Build WHERE clauses
    const whereClauses: string[] = [];
    const params: any[] = [];

    // Text search on title and description
    if (query) {
      // Check if query starts with gender keywords (men, women, boys, girls)
      const genderKeywords = ['men', 'women', 'boys', 'girls'];
      const lowerQuery = query.toLowerCase();
      const startsWithGender = genderKeywords.some(keyword => lowerQuery.startsWith(keyword));

      if (startsWithGender) {
        // For gender-specific queries, extract just the gender keyword and match at word boundaries
        // to avoid "men" matching "Women"
        const genderKeyword = genderKeywords.find(keyword => lowerQuery.startsWith(keyword))!;
        whereClauses.push('REGEXP_CONTAINS(LOWER(title), r"\\b' + genderKeyword + '\\b")');
      } else {
        // For other queries, split into words and match any word in title
        const words = query.toLowerCase().split(/\s+/).filter(w => w.length > 2);
        if (words.length > 0) {
          const wordMatches = words.map(word => `LOWER(title) LIKE '%${word}%'`).join(' OR ');
          whereClauses.push(`(${wordMatches})`);
        }
      }
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        // Use LIKE for flexible category matching (handles singular/plural variations)
        whereClauses.push('LOWER(category) LIKE LOWER(@category)');
        params.push(`%${filters.category}%`);
      }
      if (filters.color) {
        whereClauses.push('LOWER(color) = LOWER(@color)');
        params.push(filters.color);
      }
      if (filters.brand) {
        whereClauses.push('LOWER(brand) = LOWER(@brand)');
        params.push(filters.brand);
      }
      if (filters.size) {
        whereClauses.push('size = @size');
        params.push(filters.size);
      }
      if (filters.fit) {
        whereClauses.push('LOWER(fit) = LOWER(@fit)');
        params.push(filters.fit);
      }
      if (filters.style) {
        whereClauses.push('LOWER(style) = LOWER(@style)');
        params.push(filters.style);
      }
      if (filters.price_min !== undefined) {
        whereClauses.push('price >= @price_min');
        params.push(filters.price_min);
      }
      if (filters.price_max !== undefined) {
        whereClauses.push('price <= @price_max');
        params.push(filters.price_max);
      }
      if (filters.occasion && filters.occasion.length > 0) {
        whereClauses.push('EXISTS (SELECT 1 FROM UNNEST(occasion_tags) AS tag WHERE tag IN UNNEST(@occasion))');
        params.push(filters.occasion);
      }
    }

    // Filter out non-clothing accessories for cleaner fashion demo
    const nonClothingCategories = [
      'deodorant', 'perfume and body mist', 'hair gels and wax', 'socks', 'belts',
      'watches', 'face wash and cleanser', 'sunscreen', 'lip balm', 'hair accessories',
      'mobile pouch', 'handbags', 'wallets', 'backpacks'
    ];
    const categoryExclusions = nonClothingCategories.map(cat => `LOWER(category) != '${cat}'`).join(' AND ');

    const baseWhere = whereClauses.length > 0 ? whereClauses.join(' AND ') : '';
    const whereClause = baseWhere
      ? `WHERE ${baseWhere} AND ${categoryExclusions}`
      : `WHERE ${categoryExclusions}`;

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
        description
      FROM \`${config.gcp.projectId}.${dataset}.${table}\`
      ${whereClause}
      ORDER BY price ASC
      LIMIT @limit
    `;

    // Create query options
    const queryOptions: any = {
      query: sqlQuery,
      params: {
        limit: limit,
      },
    };

    // Add filter parameters
    if (filters) {
      if (filters.category) queryOptions.params.category = `%${filters.category}%`;
      if (filters.color) queryOptions.params.color = filters.color;
      if (filters.brand) queryOptions.params.brand = filters.brand;
      if (filters.size) queryOptions.params.size = filters.size;
      if (filters.fit) queryOptions.params.fit = filters.fit;
      if (filters.style) queryOptions.params.style = filters.style;
      if (filters.price_min !== undefined) queryOptions.params.price_min = filters.price_min;
      if (filters.price_max !== undefined) queryOptions.params.price_max = filters.price_max;
      if (filters.occasion) queryOptions.params.occasion = filters.occasion;
    }

    const [rows] = await bq.query(queryOptions);
    return rows as Product[];
  } catch (error) {
    console.error('Error querying BigQuery:', error);
    // Return mock data for development
    return getMockProducts(query, filters, limit);
  }
}

// Mock data for development/testing when BigQuery is not available
// Matches the 10 products in BigQuery: nrf-search-demo.fashion_catalog.products
function getMockProducts(query: string, filters?: SearchFilters, limit: number = 20): Product[] {
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
      product_id: 'SKU002',
      title: 'Navy Blue Regular Fit Trousers',
      brand: 'Van Heusen',
      price: 2999,
      image_url: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400&h=600&fit=crop&q=80',
      category: 'trousers',
      color: 'navy',
      size: '42',
      fit: 'regular',
      occasion_tags: ['formal', 'office'],
      style: 'formal',
      description: 'Navy blue regular fit formal trousers',
    },
    {
      product_id: 'SKU003',
      title: 'Beige A-Line Kurti',
      brand: 'Fabindia',
      price: 2299,
      image_url: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?w=400&h=600&fit=crop&q=80',
      category: 'kurti',
      color: 'beige',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['casual', 'semi-formal'],
      style: 'ethnic',
      description: 'Elegant beige A-line kurti for casual occasions',
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
    {
      product_id: 'SKU006',
      title: 'Olive Green Cotton Palazzo',
      brand: 'Biba',
      price: 1899,
      image_url: 'https://images.unsplash.com/photo-1594633312681-425c7b97ccd1?w=400&h=600&fit=crop&q=80',
      category: 'palazzo',
      color: 'olive',
      size: 'L',
      fit: 'regular',
      occasion_tags: ['casual', 'festive'],
      style: 'ethnic',
      description: 'Comfortable olive green cotton palazzo pants',
    },
    {
      product_id: 'SKU007',
      title: 'Black Formal Blazer',
      brand: 'Raymond',
      price: 8999,
      image_url: 'https://images.unsplash.com/photo-1507679799987-c73779587ccf?w=400&h=600&fit=crop&q=80',
      category: 'blazer',
      color: 'black',
      size: '42',
      fit: 'regular',
      occasion_tags: ['formal', 'office'],
      style: 'formal',
      description: 'Premium black formal blazer',
    },
    {
      product_id: 'SKU008',
      title: 'Floral Print Maxi Dress',
      brand: 'W',
      price: 3499,
      image_url: 'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?w=400&h=600&fit=crop&q=80',
      category: 'dress',
      color: 'multicolor',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['casual', 'party'],
      style: 'western',
      description: 'Beautiful floral print maxi dress',
    },
    {
      product_id: 'SKU009',
      title: 'Denim Jeans Blue',
      brand: 'Levis',
      price: 4999,
      image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400&h=600&fit=crop&q=80',
      category: 'jeans',
      color: 'blue',
      size: '32',
      fit: 'slim',
      occasion_tags: ['casual'],
      style: 'casual',
      description: 'Classic blue denim jeans',
    },
    {
      product_id: 'SKU010',
      title: 'Red Running Shoes',
      brand: 'Nike',
      price: 6999,
      image_url: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400&h=600&fit=crop&q=80',
      category: 'shoes',
      color: 'red',
      size: '9',
      fit: 'regular',
      occasion_tags: ['sports', 'casual'],
      style: 'athletic',
      description: 'Comfortable red running shoes',
    },
  ];

  // Simple filtering logic for mock data
  let filtered = mockProducts;

  if (query) {
    const lowerQuery = query.toLowerCase();
    filtered = filtered.filter(
      (p) =>
        p.title.toLowerCase().includes(lowerQuery) ||
        p.description?.toLowerCase().includes(lowerQuery) ||
        p.category.toLowerCase().includes(lowerQuery)
    );
  }

  if (filters) {
    if (filters.category) {
      filtered = filtered.filter((p) => p.category.toLowerCase() === filters.category?.toLowerCase());
    }
    if (filters.color) {
      filtered = filtered.filter((p) => p.color.toLowerCase() === filters.color?.toLowerCase());
    }
    if (filters.brand) {
      filtered = filtered.filter((p) => p.brand.toLowerCase() === filters.brand?.toLowerCase());
    }
    if (filters.size) {
      filtered = filtered.filter((p) => p.size === filters.size);
    }
    if (filters.fit) {
      filtered = filtered.filter((p) => p.fit?.toLowerCase() === filters.fit?.toLowerCase());
    }
    if (filters.style) {
      filtered = filtered.filter((p) => p.style?.toLowerCase() === filters.style?.toLowerCase());
    }
    if (filters.price_min !== undefined) {
      filtered = filtered.filter((p) => p.price >= filters.price_min!);
    }
    if (filters.price_max !== undefined) {
      filtered = filtered.filter((p) => p.price <= filters.price_max!);
    }
  }

  return filtered.slice(0, limit);
}

export async function getDealsProducts(limit: number = 10): Promise<Product[]> {
  // Return mock deals for now
  return getMockProducts('', undefined, limit);
}

export async function getTopSellingProducts(limit: number = 10): Promise<Product[]> {
  // Return mock top selling products for now
  return getMockProducts('', undefined, limit);
}
