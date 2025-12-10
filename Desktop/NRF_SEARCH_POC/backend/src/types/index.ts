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
  style?: string[];
  color?: string[];
  price?: string[];
  fit?: string[];
  occasion?: string[];
  [key: string]: string[] | undefined;
}

export interface IntentResponse {
  mode: IntentMode;
  entities: Entities;
  chips?: Chips;
}

export interface Product {
  product_id: string;
  title: string;
  brand: string;
  price: number;
  image_url: string;
  category: string;
  color: string;
  size?: string;
  fit?: string;
  occasion_tags?: string[];
  style?: string;
  description?: string;
  attributes?: Record<string, any>;
}

export interface SearchResultsResponse {
  results: Product[];
  total: number;
}

export interface ClarifyGoalResponse {
  question: string;
  options: string[];
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

export interface ComposeOutfitsResponse {
  looks: Look[];
}

export interface ExplainResultsResponse {
  explanation: string[];
}

export interface AnalyticsEvent {
  session_id: string;
  event_name: string;
  timestamp: string;
  metadata?: Record<string, any>;
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

export interface SearchRequest {
  session_id: string;
  query: string;
  entities?: Entities;
  filters?: SearchFilters;
}

export interface IntentRequest {
  session_id: string;
  query: string;
}

export interface ClarifyGoalRequest {
  session_id: string;
  query: string;
  entities: Entities;
}

export interface ComposeOutfitsRequest {
  session_id: string;
  query: string;
  entities: Entities;
  choice: Record<string, string>;
}

export interface ExplainResultsRequest {
  session_id: string;
  query: string;
  top_results: Array<{
    product_id: string;
    title: string;
    rank: number;
    matched_attributes: string[];
  }>;
}
