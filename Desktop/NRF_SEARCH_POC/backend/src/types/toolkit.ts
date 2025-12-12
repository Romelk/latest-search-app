/**
 * Type definitions for AI Fashion Toolkit
 */

import { ImageInput } from '../services/claudeVision.service';

// ==================== Common Types ====================

export interface ToolkitRequest {
  session_id: string;
  tool_name: string;
  images: ImageInput[];
  metadata?: any;
}

export interface ToolkitResponse<T = any> {
  success: boolean;
  tool_name: string;
  result: T;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
  session_usage: {
    total_cost: number;
    remaining_budget: number;
    usage_percentage: number;
    warning_level: 'none' | 'approaching' | 'critical' | 'exceeded';
  };
}

export interface ToolkitError {
  error: string;
  message: string;
  code?: string;
}

// ==================== Feature 1: Style Analyzer ====================

export interface StyleAnalysisResult {
  dominant_colors: string[];
  color_hex_codes: string[];
  style_category:
    | 'casual'
    | 'formal'
    | 'smart casual'
    | 'bohemian'
    | 'athleisure'
    | 'streetwear'
    | 'vintage'
    | 'minimalist'
    | 'unknown';
  clothing_items: string[];
  fit_type: 'slim' | 'regular' | 'oversized' | 'athletic' | 'unknown';
  occasions: string[];
  season: 'spring' | 'summer' | 'fall' | 'winter' | 'all-season' | 'unknown';
  formality_score: number; // 1-10
  style_confidence: number; // 1-10
  improvement_tips: string[];
}

// ==================== Feature 2: Compatibility Checker ====================

export interface ColorHarmony {
  score: number; // 0-10
  reasoning: string;
}

export interface StyleMatch {
  score: number; // 0-10
  reasoning: string;
}

export interface OccasionFit {
  compatible_occasions: string[];
  reasoning: string;
}

export interface CompatibilityResult {
  compatibility_score: number; // 0-100
  color_harmony: ColorHarmony;
  style_match: StyleMatch;
  occasion_fit: OccasionFit;
  overall_verdict: 'excellent' | 'good' | 'acceptable' | 'poor';
  improvement_suggestions: string[];
  styling_tips: string[];
}

// ==================== Feature 3: Visual Search ====================

export interface VisualSearchResult {
  detected_attributes: {
    category?: string;
    colors?: string[];
    style?: string;
    pattern?: string;
  };
  matching_products: Array<{
    product_id: string;
    title: string;
    brand: string;
    price: number;
    image_url: string;
    similarity_score: number;
  }>;
  total_matches: number;
}

// ==================== Feature 4: Try-On Visualization ====================

export interface TryOnResult {
  fit_analysis: {
    size_recommendation: string;
    fit_notes: string;
  };
  styling_recommendations: string[];
  complementary_items: Array<{
    category: string;
    suggestions: string[];
  }>;
  confidence_score: number;
}

// ==================== Feature 5: Style Profile ====================

export interface SeasonalPreferences {
  spring: string[];
  summer: string[];
  fall: string[];
  winter: string[];
}

export interface ShoppingRecommendations {
  must_have_items: string[];
  colors_to_try: string[];
  styles_to_explore: string[];
}

export interface StyleProfileResult {
  signature_colors: string[];
  preferred_styles: string[];
  style_personality:
    | 'classic'
    | 'trendy'
    | 'eclectic'
    | 'minimalist'
    | 'bohemian'
    | 'edgy'
    | 'unknown';
  formality_preference: 'casual' | 'smart casual' | 'business casual' | 'formal' | 'unknown';
  common_patterns: string[];
  preferred_silhouettes: string[];
  seasonal_preferences: SeasonalPreferences;
  shopping_recommendations: ShoppingRecommendations;
  style_consistency_score: number; // 0-10
  confidence_level: number; // 0-10
  summary: string;
}
