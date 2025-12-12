/**
 * Frontend type definitions for AI Fashion Toolkit
 */

// ==================== API Response Types ====================

export interface ToolkitUsage {
  input_tokens: number;
  output_tokens: number;
  cost_usd: number;
}

export interface SessionUsage {
  total_cost: number;
  remaining_budget: number;
  usage_percentage: number;
  warning_level: 'none' | 'approaching' | 'critical' | 'exceeded';
}

export interface ToolkitResponse<T = any> {
  success: boolean;
  tool_name: string;
  result: T;
  usage: ToolkitUsage;
  session_usage: SessionUsage;
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

// ==================== Tool Metadata ====================

export interface ToolMetadata {
  name: string;
  displayName: string;
  description: string;
  category: string;
  requiresImages: number;
  estimatedCost: number;
  icon: string;
}

// ==================== UI State ====================

export interface UploadedImage {
  id: string;
  dataUrl: string;
  file: File;
  preview: string;
}

export interface ToolkitState {
  selectedTool: string | null;
  images: UploadedImage[];
  isAnalyzing: boolean;
  result: any | null;
  error: string | null;
  sessionUsage: SessionUsage | null;
}
