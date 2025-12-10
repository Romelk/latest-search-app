export type IntentMode = 'CLEAR' | 'AMBIGUOUS' | 'GOAL' | 'NONE';

export interface Entities {
  occasion?: string | null;
  participants?: string | null;
  age_group?: string | null;
  body_type?: string | null;
  style?: string | null;
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
}

export interface Category {
  id: string;
  name: string;
  description: string;
  image_url: string;
}
