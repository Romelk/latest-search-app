export type IntentMode = 'CLEAR' | 'AMBIGUOUS' | 'GOAL' | 'NONE';

export interface Entities {
  occasion?: string | null;
  participants?: string | null;
  shopping_for?: 'self' | 'family' | 'partner' | 'gift' | null;
  family_member_type?: 'father_brother' | 'mother_sister' | 'grandparent' | null;
  gender?: string | null;
  age_group?: string | null;
  body_type?: string | null;
  style?: string | null;
  style_preference?: string | null;
  palette?: string | null;
  budget?: string | null;
  category?: string | null;
  color?: string | null;
  size?: string | null;
  brand?: string | null;
  fit?: string | null;
}

export interface Chips {
  [key: string]: string[];
}

export interface Product {
  product_id: string;
  title: string;
  brand: string;
  price: number;
  image_url: string;
  category: string;
  color?: string;
  size?: string;
  fit?: string;
  occasion_tags?: string[];
  style?: string;
  description?: string;
  // Myntra CSV fields
  rating?: number;
  rating_count?: number;
  discount_percentage?: number;
  original_price?: number;
  product_url?: string;
  image_urls?: string[];
  data_source?: string;
}

export interface LookItem {
  for: string;
  product_id: string;
  title: string;
  price: number;
  image_url: string;
  brand: string;
  category: string;
}

export interface Look {
  name: string;
  total_price: number;
  items: LookItem[];
  reason: string;
}

export interface SearchFilters {
  category?: string;
  gender?: string;
  price_min?: number;
  price_max?: number;
  brand?: string;
  color?: string;
  size?: string;
  fit?: string;
  style?: string;
  occasion?: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  options?: string[];
  chips?: Chips;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
}

// Complete the Look Types
export interface OutfitItem {
  product_id: string;
  role: string;  // e.g., "top", "bottom", "footwear", "accessory"
}

export interface Outfit {
  outfit_id: string;
  gender: string;
  occasion: string;
  items: OutfitItem[];
  enriched_products?: Product[];  // Full product details after enrichment
}

export interface CompleteTheLookResponse {
  outfits: Outfit[];                // Up to 3 complete outfits
  complementary_items: Product[];   // Up to 4 individual complementary products
  total_outfits: number;            // Total number of outfits found
}
