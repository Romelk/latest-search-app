/**
 * TypeScript interfaces for Python backend API responses
 * The TypeScript agent backend calls the Python backend (port 8000) via HTTP
 * to reuse existing Gemini image generation and trends database functionality
 */

// Common error response
export interface PythonErrorResponse {
  detail: string;
}

// Trends API responses
export interface TrendItem {
  name: string;
  description: string;
  keywords: string[];
  region?: string;
  occasion_type?: string;
}

export interface TrendsResponse {
  trends: TrendItem[];
  count: number;
  region?: string;
}

// Image generation responses
export interface ImageMetadata {
  prompt_used?: string;
  aspect_ratio?: string;
  style?: string;
}

export interface ImageGenerationResponse {
  success: boolean;
  data: {
    image_data: string;
    metadata?: ImageMetadata;
  };
}

export interface OutfitVariation {
  image_data: string;
  variation_number: number;
}

export interface OutfitVariationsResponse {
  success: boolean;
  data: {
    variations: OutfitVariation[];
  };
}

export interface MultiAngleResponse {
  success: boolean;
  data: {
    images: string[];
  };
}

export interface VideoGenerationResponse {
  success: boolean;
  data: {
    video_data: string;
    metadata?: {
      duration?: number;
      aspect_ratio?: string;
    };
  };
}

export interface BackendStatsResponse {
  trends_count: number;
  database_status: string;
  timestamp: string;
}
