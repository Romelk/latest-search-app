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
      whereClauses.push('(LOWER(title) LIKE LOWER(@query) OR LOWER(description) LIKE LOWER(@query))');
      params.push(`%${query}%`);
    }

    // Apply filters
    if (filters) {
      if (filters.category) {
        whereClauses.push('LOWER(category) = LOWER(@category)');
        params.push(filters.category);
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

    const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

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
        query: query ? `%${query}%` : '',
        limit: limit,
      },
    };

    // Add filter parameters
    if (filters) {
      if (filters.category) queryOptions.params.category = filters.category;
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
function getMockProducts(query: string, filters?: SearchFilters, limit: number = 20): Product[] {
  const mockProducts: Product[] = [
    // Basic formal wear
    {
      product_id: 'SKU001',
      title: 'Blue Formal Shirt',
      brand: 'Peter England',
      price: 2499,
      image_url: 'https://via.placeholder.com/300x400/4A90E2/FFFFFF?text=Blue+Shirt',
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
      image_url: 'https://via.placeholder.com/300x400/2C3E50/FFFFFF?text=Navy+Trousers',
      category: 'pant',
      color: 'navy',
      size: '42',
      fit: 'regular',
      occasion_tags: ['formal', 'office'],
      style: 'formal',
      description: 'Navy blue regular fit formal trousers',
    },
    {
      product_id: 'SKU004',
      title: 'White Cotton Shirt',
      brand: 'Arrow',
      price: 2799,
      image_url: 'https://via.placeholder.com/300x400/FFFFFF/000000?text=White+Shirt',
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
      image_url: 'https://via.placeholder.com/300x400/95A5A6/FFFFFF?text=Grey+Chinos',
      category: 'pant',
      color: 'grey',
      size: '42',
      fit: 'comfort',
      occasion_tags: ['casual', 'smart-casual'],
      style: 'casual',
      description: 'Comfortable grey chinos for everyday wear',
    },
    // Formal blazers and jackets for wedding/formal events
    {
      product_id: 'SKU011',
      title: 'Navy Blue Formal Blazer',
      brand: 'Raymond',
      price: 8999,
      image_url: 'https://via.placeholder.com/300x400/1E3A5F/FFFFFF?text=Navy+Blazer',
      category: 'jacket',
      color: 'navy',
      size: '42',
      fit: 'regular',
      occasion_tags: ['formal', 'wedding', 'party'],
      style: 'formal',
      description: 'Premium navy blue formal blazer for weddings and formal events',
    },
    {
      product_id: 'SKU012',
      title: 'Grey Wool Jacket',
      brand: 'Louis Philippe',
      price: 7499,
      image_url: 'https://via.placeholder.com/300x400/808080/FFFFFF?text=Grey+Jacket',
      category: 'jacket',
      color: 'grey',
      size: '42',
      fit: 'slim',
      occasion_tags: ['formal', 'wedding'],
      style: 'formal',
      description: 'Elegant grey wool jacket perfect for winter weddings',
    },
    {
      product_id: 'SKU013',
      title: 'Black Formal Trousers',
      brand: 'Van Heusen',
      price: 3299,
      image_url: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Pants',
      category: 'pant',
      color: 'black',
      size: '42',
      fit: 'regular',
      occasion_tags: ['formal', 'wedding', 'party'],
      style: 'formal',
      description: 'Classic black formal trousers for formal occasions',
    },
    // Party dresses for women
    {
      product_id: 'SKU014',
      title: 'Burgundy Evening Dress',
      brand: 'W',
      price: 4999,
      image_url: 'https://via.placeholder.com/300x400/800020/FFFFFF?text=Burgundy+Dress',
      category: 'dress',
      color: 'burgundy',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['party', 'wedding'],
      style: 'western',
      description: 'Elegant burgundy evening dress for weddings and parties',
    },
    {
      product_id: 'SKU015',
      title: 'Emerald Green Cocktail Dress',
      brand: 'AND',
      price: 5499,
      image_url: 'https://via.placeholder.com/300x400/50C878/FFFFFF?text=Green+Dress',
      category: 'dress',
      color: 'green',
      size: 'L',
      fit: 'regular',
      occasion_tags: ['party', 'cocktail'],
      style: 'western',
      description: 'Stunning emerald green cocktail dress',
    },
    {
      product_id: 'SKU016',
      title: 'Navy Blue A-Line Dress',
      brand: 'Vero Moda',
      price: 3999,
      image_url: 'https://via.placeholder.com/300x400/000080/FFFFFF?text=Navy+Dress',
      category: 'dress',
      color: 'navy',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['party', 'formal'],
      style: 'western',
      description: 'Classic navy blue A-line dress for formal events',
    },
    // Traditional Indian wear - Sarees
    {
      product_id: 'SKU017',
      title: 'Red Silk Saree with Golden Border',
      brand: 'Kanchipuram',
      price: 12999,
      image_url: 'https://via.placeholder.com/300x400/FF0000/FFD700?text=Red+Saree',
      category: 'saree',
      color: 'red',
      size: 'Free',
      fit: 'regular',
      occasion_tags: ['wedding', 'festive'],
      style: 'traditional',
      description: 'Exquisite red silk saree with traditional golden border',
    },
    {
      product_id: 'SKU018',
      title: 'Blue Banarasi Saree',
      brand: 'Fabindia',
      price: 9999,
      image_url: 'https://via.placeholder.com/300x400/0000FF/FFD700?text=Blue+Saree',
      category: 'saree',
      color: 'blue',
      size: 'Free',
      fit: 'regular',
      occasion_tags: ['wedding', 'festive'],
      style: 'traditional',
      description: 'Beautiful blue Banarasi saree for weddings',
    },
    {
      product_id: 'SKU019',
      title: 'Maroon Designer Saree',
      brand: 'Sabyasachi',
      price: 15999,
      image_url: 'https://via.placeholder.com/300x400/800000/FFD700?text=Maroon+Saree',
      category: 'saree',
      color: 'maroon',
      size: 'Free',
      fit: 'regular',
      occasion_tags: ['wedding', 'party'],
      style: 'traditional',
      description: 'Designer maroon saree with intricate embroidery',
    },
    // Traditional Indian wear - Kurtas and ethnic
    {
      product_id: 'SKU003',
      title: 'Beige A-Line Kurti',
      brand: 'Fabindia',
      price: 2299,
      image_url: 'https://via.placeholder.com/300x400/D4A574/FFFFFF?text=Beige+Kurti',
      category: 'top',
      color: 'beige',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['casual', 'semi-formal'],
      style: 'ethnic',
      description: 'Elegant beige A-line kurti for casual occasions',
    },
    {
      product_id: 'SKU020',
      title: 'Cream Embroidered Kurta Set',
      brand: 'Manyavar',
      price: 6999,
      image_url: 'https://via.placeholder.com/300x400/FFFDD0/8B4513?text=Cream+Kurta',
      category: 'shirt',
      color: 'cream',
      size: '42',
      fit: 'regular',
      occasion_tags: ['wedding', 'festive'],
      style: 'traditional',
      description: 'Elegant cream embroidered kurta set for weddings',
    },
    {
      product_id: 'SKU037',
      title: 'Blue Indo-Western Kurta',
      brand: 'Manyavar',
      price: 5999,
      image_url: 'https://via.placeholder.com/300x400/4169E1/FFFFFF?text=Blue+Kurta',
      category: 'shirt',
      color: 'blue',
      size: '42',
      fit: 'slim',
      occasion_tags: ['wedding', 'party'],
      style: 'indo-western',
      description: 'Modern blue indo-western kurta with contemporary cut',
    },
    // Traditional formal wear
    {
      product_id: 'SKU021',
      title: 'Ivory Embroidered Wedding Sherwani',
      brand: 'Manyavar',
      price: 18999,
      image_url: 'https://via.placeholder.com/300x400/FFFFF0/DAA520?text=Ivory+Sherwani',
      category: 'jacket',
      color: 'ivory',
      size: '42',
      fit: 'regular',
      occasion_tags: ['wedding'],
      style: 'traditional',
      description: 'Premium ivory sherwani with intricate embroidery for weddings',
    },
    {
      product_id: 'SKU022',
      title: 'Maroon Velvet Sherwani',
      brand: 'Manyavar',
      price: 22999,
      image_url: 'https://via.placeholder.com/300x400/800000/FFD700?text=Maroon+Sherwani',
      category: 'jacket',
      color: 'maroon',
      size: '42',
      fit: 'regular',
      occasion_tags: ['wedding'],
      style: 'traditional',
      description: 'Luxurious maroon velvet sherwani for grand weddings',
    },
    {
      product_id: 'SKU023',
      title: 'Pink Anarkali Suit',
      brand: 'Biba',
      price: 7999,
      image_url: 'https://via.placeholder.com/300x400/FFC0CB/FFD700?text=Pink+Anarkali',
      category: 'dress',
      color: 'pink',
      size: 'L',
      fit: 'regular',
      occasion_tags: ['wedding', 'festive'],
      style: 'traditional',
      description: 'Beautiful pink anarkali suit with embellishments',
    },
    {
      product_id: 'SKU024',
      title: 'Red Designer Lehenga',
      brand: 'Kalki',
      price: 24999,
      image_url: 'https://via.placeholder.com/300x400/DC143C/FFD700?text=Red+Lehenga',
      category: 'dress',
      color: 'red',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['wedding'],
      style: 'traditional',
      description: 'Stunning red designer lehenga for weddings',
    },
    // Winter clothing - Coats and jackets
    {
      product_id: 'SKU025',
      title: 'Black Woolen Overcoat',
      brand: 'Raymond',
      price: 12999,
      image_url: 'https://via.placeholder.com/300x400/000000/FFFFFF?text=Black+Coat',
      category: 'coat',
      color: 'black',
      size: '42',
      fit: 'regular',
      occasion_tags: ['formal', 'winter'],
      style: 'formal',
      description: 'Premium black woolen overcoat for winter formal occasions',
    },
    {
      product_id: 'SKU026',
      title: 'Grey Winter Jacket',
      brand: 'Allen Solly',
      price: 5999,
      image_url: 'https://via.placeholder.com/300x400/808080/FFFFFF?text=Grey+Jacket',
      category: 'jacket',
      color: 'grey',
      size: '42',
      fit: 'regular',
      occasion_tags: ['casual', 'winter'],
      style: 'casual',
      description: 'Warm grey winter jacket for cold weather',
    },
    {
      product_id: 'SKU027',
      title: 'Navy Blue Puffer Jacket',
      brand: 'Marks & Spencer',
      price: 6499,
      image_url: 'https://via.placeholder.com/300x400/000080/FFFFFF?text=Navy+Puffer',
      category: 'jacket',
      color: 'navy',
      size: 'L',
      fit: 'regular',
      occasion_tags: ['casual', 'winter'],
      style: 'casual',
      description: 'Insulated navy blue puffer jacket for extreme cold',
    },
    {
      product_id: 'SKU028',
      title: 'Beige Trench Coat',
      brand: 'Zara',
      price: 9999,
      image_url: 'https://via.placeholder.com/300x400/D2B48C/FFFFFF?text=Beige+Trench',
      category: 'coat',
      color: 'beige',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['formal', 'winter'],
      style: 'formal',
      description: 'Classic beige trench coat for elegant winter styling',
    },
    // Sweaters and cardigans
    {
      product_id: 'SKU029',
      title: 'Brown Wool Sweater',
      brand: 'Van Heusen',
      price: 3499,
      image_url: 'https://via.placeholder.com/300x400/8B4513/FFFFFF?text=Brown+Sweater',
      category: 'sweater',
      color: 'brown',
      size: '42',
      fit: 'regular',
      occasion_tags: ['casual', 'winter'],
      style: 'casual',
      description: 'Warm brown wool sweater for winter comfort',
    },
    {
      product_id: 'SKU030',
      title: 'Grey Cardigan',
      brand: 'Marks & Spencer',
      price: 2999,
      image_url: 'https://via.placeholder.com/300x400/A9A9A9/FFFFFF?text=Grey+Cardigan',
      category: 'sweater',
      color: 'grey',
      size: 'L',
      fit: 'regular',
      occasion_tags: ['casual', 'winter'],
      style: 'casual',
      description: 'Cozy grey cardigan for layering in winter',
    },
    // Party tops
    {
      product_id: 'SKU031',
      title: 'Black Sequin Party Top',
      brand: 'Forever 21',
      price: 2499,
      image_url: 'https://via.placeholder.com/300x400/000000/FFD700?text=Black+Party+Top',
      category: 'top',
      color: 'black',
      size: 'M',
      fit: 'regular',
      occasion_tags: ['party', 'cocktail'],
      style: 'western',
      description: 'Glamorous black sequin top for parties',
    },
    {
      product_id: 'SKU032',
      title: 'Silver Metallic Blouse',
      brand: 'H&M',
      price: 1999,
      image_url: 'https://via.placeholder.com/300x400/C0C0C0/000000?text=Silver+Blouse',
      category: 'top',
      color: 'silver',
      size: 'S',
      fit: 'slim',
      occasion_tags: ['party', 'cocktail'],
      style: 'western',
      description: 'Shimmering silver metallic blouse for evening events',
    },
    // Palazzo pants
    {
      product_id: 'SKU006',
      title: 'Olive Green Cotton Palazzo',
      brand: 'Biba',
      price: 1899,
      image_url: 'https://via.placeholder.com/300x400/556B2F/FFFFFF?text=Olive+Palazzo',
      category: 'pant',
      color: 'olive',
      size: 'L',
      fit: 'regular',
      occasion_tags: ['casual', 'festive'],
      style: 'ethnic',
      description: 'Comfortable olive green cotton palazzo pants',
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
