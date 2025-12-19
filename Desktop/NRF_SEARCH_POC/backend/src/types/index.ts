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
  raw_category?: string;
  gender?: string;
  color: string;
  size?: string;
  fit?: string;
  occasion_tags?: string[];
  style?: string;
  description?: string;
  attributes?: Record<string, any>;
  // Myntra CSV fields
  rating?: number;
  rating_count?: number;
  discount_percentage?: number;
  original_price?: number;
  product_url?: string;
  image_urls?: string[];
  data_source?: string;
}

export interface SearchFulfillment {
  fulfillment_type: 'exact' | 'partial' | 'none';
  matched_attributes: string[];
  missing_attributes: string[];
  user_message: string;
  suggestion?: string;
}

export interface SearchResultsResponse {
  results: Product[];
  total: number;
  fulfillment?: SearchFulfillment;
}

export interface ClarifyGoalResponse {
  question: string;
  options: string[];
  gathering_info?: boolean;
  ready_to_compose?: boolean;
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
  conversation_history?: string;
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

export interface ChatMessageRequest {
  session_id: string;
  intent_mode: IntentMode;
  action: 'search_complete' | 'chip_selected' | 'product_clicked' | 'conversation_start';
  context: {
    query?: string;
    product_count?: number;
    selected_chips?: Record<string, string>;
    product?: Product;
    conversation_history?: string;
  };
}

export interface ChatMessageResponse {
  message: string;
}

// Tool-based Agent Architecture Types
export type ToolName =
  | 'search_products'           // Standard product search
  | 'find_matching'             // Find complementary/matching items
  | 'refine_with_chips'         // Suggest chip-based refinement
  | 'conversational_response';  // Pure conversation

export interface ToolCall {
  tool: ToolName;
  parameters: Record<string, any>;
  reasoning?: string;  // Why this tool was chosen
}

export interface SearchProductsTool {
  query: string;
  filters?: SearchFilters;
  preserve_context?: boolean;  // Keep existing search context
}

export interface FindMatchingTool {
  reference_context: {
    category?: string;      // Original category (e.g., "shirt")
    color?: string;         // Original color
    style?: string;         // Original style
    occasion?: string;      // Original occasion
  };
  target_category: string;  // What to search for (e.g., "pant")
  preserve: string[];       // Attributes to preserve (e.g., ["style", "occasion"])
  vary: string[];          // Attributes to vary/show options (e.g., ["color"])
}

export interface RefineWithChipsTool {
  message: string;          // Conversational message
  suggest_chips?: string[]; // Which chip categories to highlight
}

export interface ConversationalResponseTool {
  message: string;
  include_context?: boolean;  // Include current search context
}

export interface ToolBasedIntentResponse {
  mode: IntentMode;
  entities: Entities;
  chips?: Chips;
  tool_call?: ToolCall;  // AI's chosen tool and parameters
}

export interface ToolBasedIntentRequest {
  session_id: string;
  query: string;
  conversation_history?: Array<{
    role: 'user' | 'assistant';
    message: string;
  }>;
  current_context?: {
    query?: string;
    products?: Product[];
    entities?: Entities;
    selected_chips?: Record<string, string[]>;
  };
}
