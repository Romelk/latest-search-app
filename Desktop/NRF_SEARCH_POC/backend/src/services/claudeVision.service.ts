/**
 * Claude Vision Service
 *
 * Provides image analysis capabilities using Claude 3.5 Sonnet Vision API
 * for the AI Fashion Toolkit.
 *
 * Key Features:
 * - Style analysis from outfit photos
 * - Color extraction and palette generation
 * - Outfit compatibility scoring
 * - Visual similarity detection
 * - Body type and fit analysis
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';
import { config } from '../config';

export interface VisionAnalysisResult {
  analysis: any;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
}

export interface ImageInput {
  data: string; // Base64 encoded image
  mediaType: 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';
}

export class ClaudeVisionService {
  private client: Anthropic;

  constructor() {
    if (!config.claude.apiKey) {
      throw new Error('CLAUDE_API_KEY is not configured');
    }

    this.client = new Anthropic({
      apiKey: config.claude.apiKey,
    });
  }

  /**
   * Analyze a single image with a custom prompt
   *
   * @param image Base64 encoded image
   * @param prompt Analysis prompt (e.g., "Analyze this outfit's style")
   * @returns Structured analysis result with token usage
   */
  async analyzeImage(
    image: ImageInput,
    prompt: string
  ): Promise<VisionAnalysisResult> {
    console.log(`\n🔍 Claude Vision: Analyzing single image`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

    try {
      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'image',
                source: {
                  type: 'base64',
                  media_type: image.mediaType,
                  data: image.data,
                },
              },
              {
                type: 'text',
                text: prompt,
              },
            ],
          },
        ],
      });

      // Extract text response
      const textBlock = response.content.find((block) => block.type === 'text');
      const analysisText = textBlock && textBlock.type === 'text' ? textBlock.text : '';

      // Parse JSON if response is structured
      let analysis: any;
      try {
        // Try to parse directly first
        analysis = JSON.parse(analysisText);
      } catch {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = analysisText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            analysis = JSON.parse(jsonMatch[1].trim());
          } catch {
            // If still can't parse, return as plain text
            analysis = { text: analysisText };
          }
        } else {
          // No code blocks found, return as plain text
          analysis = { text: analysisText };
        }
      }

      // Calculate cost (Claude Sonnet 4.5 pricing)
      const inputCost = (response.usage.input_tokens / 1_000_000) * 3.0; // $3 per MTok
      const outputCost = (response.usage.output_tokens / 1_000_000) * 15.0; // $15 per MTok
      const totalCost = inputCost + outputCost;

      console.log(`   ✅ Analysis complete`);
      console.log(`   📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
      console.log(`   💰 Cost: $${totalCost.toFixed(4)}`);

      return {
        analysis,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cost_usd: totalCost,
        },
      };
    } catch (error: any) {
      console.error('❌ Claude Vision error:', error.message);
      throw new Error(`Claude Vision analysis failed: ${error.message}`);
    }
  }

  /**
   * Analyze multiple images together (e.g., outfit compatibility)
   *
   * @param images Array of Base64 encoded images
   * @param prompt Analysis prompt
   * @returns Structured analysis result with token usage
   */
  async analyzeMultipleImages(
    images: ImageInput[],
    prompt: string
  ): Promise<VisionAnalysisResult> {
    console.log(`\n🔍 Claude Vision: Analyzing ${images.length} images`);
    console.log(`   Prompt: ${prompt.substring(0, 100)}...`);

    if (images.length === 0) {
      throw new Error('At least one image is required');
    }

    if (images.length > 20) {
      throw new Error('Maximum 20 images per request');
    }

    try {
      // Build content array with all images + prompt
      const content: any[] = [];

      // Add all images first
      for (let i = 0; i < images.length; i++) {
        content.push({
          type: 'image',
          source: {
            type: 'base64',
            media_type: images[i].mediaType,
            data: images[i].data,
          },
        });
      }

      // Add prompt at the end
      content.push({
        type: 'text',
        text: prompt,
      });

      const response = await this.client.messages.create({
        model: config.claude.model,
        max_tokens: config.claude.maxTokens,
        messages: [
          {
            role: 'user',
            content,
          },
        ],
      });

      // Extract text response
      const textBlock = response.content.find((block) => block.type === 'text');
      const analysisText = textBlock && textBlock.type === 'text' ? textBlock.text : '';

      // Parse JSON if response is structured
      let analysis: any;
      try {
        // Try to parse directly first
        analysis = JSON.parse(analysisText);
      } catch {
        // If that fails, try to extract JSON from markdown code blocks
        const jsonMatch = analysisText.match(/```(?:json)?\s*\n?([\s\S]*?)\n?```/);
        if (jsonMatch && jsonMatch[1]) {
          try {
            analysis = JSON.parse(jsonMatch[1].trim());
          } catch {
            // If still can't parse, return as plain text
            analysis = { text: analysisText };
          }
        } else {
          // No code blocks found, return as plain text
          analysis = { text: analysisText };
        }
      }

      // Calculate cost
      const inputCost = (response.usage.input_tokens / 1_000_000) * 3.0;
      const outputCost = (response.usage.output_tokens / 1_000_000) * 15.0;
      const totalCost = inputCost + outputCost;

      console.log(`   ✅ Multi-image analysis complete`);
      console.log(`   📊 Tokens: ${response.usage.input_tokens} in, ${response.usage.output_tokens} out`);
      console.log(`   💰 Cost: $${totalCost.toFixed(4)}`);

      return {
        analysis,
        usage: {
          input_tokens: response.usage.input_tokens,
          output_tokens: response.usage.output_tokens,
          cost_usd: totalCost,
        },
      };
    } catch (error: any) {
      console.error('❌ Claude Vision error:', error.message);
      throw new Error(`Claude Vision multi-image analysis failed: ${error.message}`);
    }
  }

  /**
   * Extract structured style attributes from an outfit photo
   *
   * @param image Base64 encoded outfit photo
   * @returns Style attributes (colors, category, occasion, etc.)
   */
  async extractStyleAttributes(image: ImageInput): Promise<VisionAnalysisResult> {
    const prompt = `Analyze this fashion outfit photo and extract the following information in JSON format:

{
  "dominant_colors": ["color1", "color2", "color3"],
  "color_hex_codes": ["#HEXCODE1", "#HEXCODE2", "#HEXCODE3"],
  "style_category": "casual | formal | smart casual | bohemian | athleisure | streetwear | vintage | minimalist",
  "clothing_items": ["item1", "item2"],
  "fit_type": "slim | regular | oversized | athletic",
  "occasions": ["work", "party", "casual outing", "formal event"],
  "season": "spring | summer | fall | winter | all-season",
  "formality_score": 1-10,
  "style_confidence": 1-10,
  "improvement_tips": ["tip1", "tip2"]
}

Be specific and accurate. If you cannot determine a value, use "unknown".`;

    return this.analyzeImage(image, prompt);
  }

  /**
   * Compare two clothing items for outfit compatibility
   *
   * @param image1 First clothing item
   * @param image2 Second clothing item
   * @returns Compatibility analysis
   */
  async checkOutfitCompatibility(
    image1: ImageInput,
    image2: ImageInput
  ): Promise<VisionAnalysisResult> {
    const prompt = `Analyze these two fashion items and determine if they work well together as an outfit. Provide your analysis in JSON format:

{
  "compatibility_score": 0-100,
  "color_harmony": {
    "score": 0-10,
    "reasoning": "explanation"
  },
  "style_match": {
    "score": 0-10,
    "reasoning": "explanation"
  },
  "occasion_fit": {
    "compatible_occasions": ["occasion1", "occasion2"],
    "reasoning": "explanation"
  },
  "overall_verdict": "excellent | good | acceptable | poor",
  "improvement_suggestions": ["suggestion1", "suggestion2"],
  "styling_tips": ["tip1", "tip2"]
}

Consider color theory, style coherence, formality levels, and seasonal appropriateness.`;

    return this.analyzeMultipleImages([image1, image2], prompt);
  }

  /**
   * Detect body type and provide fit recommendations
   *
   * @param image Photo of person (full body or upper body)
   * @returns Body type analysis and fit recommendations
   */
  async analyzeBodyTypeAndFit(image: ImageInput): Promise<VisionAnalysisResult> {
    const prompt = `Analyze this photo to provide clothing fit recommendations. Respond in JSON format:

{
  "body_silhouette": "rectangle | triangle | inverted triangle | hourglass | oval",
  "recommended_fits": ["slim fit", "regular fit", "relaxed fit"],
  "size_considerations": {
    "shoulders": "narrow | average | broad",
    "torso": "short | average | long",
    "build": "slim | athletic | average | plus-size"
  },
  "styling_recommendations": ["recommendation1", "recommendation2"],
  "flattering_styles": ["style1", "style2"],
  "colors_to_emphasize": ["color1", "color2"],
  "confidence_level": 1-10
}

Be respectful and constructive. Focus on fit recommendations, not body judgments.`;

    return this.analyzeImage(image, prompt);
  }

  /**
   * Extract color palette from an image for matching products
   *
   * @param image Inspiration image or outfit photo
   * @returns Color palette with hex codes
   */
  async extractColorPalette(image: ImageInput): Promise<VisionAnalysisResult> {
    const prompt = `Extract the dominant color palette from this image. Respond in JSON format:

{
  "primary_color": {
    "name": "color name",
    "hex": "#HEXCODE",
    "percentage": 0-100
  },
  "secondary_colors": [
    {
      "name": "color name",
      "hex": "#HEXCODE",
      "percentage": 0-100
    }
  ],
  "accent_colors": [
    {
      "name": "color name",
      "hex": "#HEXCODE"
    }
  ],
  "color_temperature": "warm | cool | neutral",
  "color_harmony": "monochromatic | analogous | complementary | triadic | split-complementary",
  "matching_recommendations": {
    "complementary_colors": ["#HEX1", "#HEX2"],
    "analogous_colors": ["#HEX1", "#HEX2"]
  }
}

Provide accurate hex codes for all colors.`;

    return this.analyzeImage(image, prompt);
  }

  /**
   * Build a personal style profile from multiple outfit images
   *
   * @param images Array of favorite outfit photos (5-10 recommended)
   * @returns Aggregated style profile
   */
  async buildStyleProfile(images: ImageInput[]): Promise<VisionAnalysisResult> {
    if (images.length < 3) {
      throw new Error('At least 3 images required for style profile analysis');
    }

    const prompt = `Analyze these ${images.length} outfit photos to create a comprehensive personal style profile. Respond in JSON format:

{
  "signature_colors": ["color1", "color2", "color3"],
  "preferred_styles": ["style1", "style2"],
  "style_personality": "classic | trendy | eclectic | minimalist | bohemian | edgy",
  "formality_preference": "casual | smart casual | business casual | formal",
  "common_patterns": ["pattern1", "pattern2"],
  "preferred_silhouettes": ["silhouette1", "silhouette2"],
  "seasonal_preferences": {
    "spring": ["item1"],
    "summer": ["item1"],
    "fall": ["item1"],
    "winter": ["item1"]
  },
  "shopping_recommendations": {
    "must_have_items": ["item1", "item2"],
    "colors_to_try": ["color1", "color2"],
    "styles_to_explore": ["style1", "style2"]
  },
  "style_consistency_score": 0-10,
  "confidence_level": 0-10,
  "summary": "A concise description of this person's style"
}

Look for patterns across all images to identify consistent style preferences.`;

    return this.analyzeMultipleImages(images, prompt);
  }
}

// Export singleton instance
let visionServiceInstance: ClaudeVisionService | null = null;

export function getClaudeVisionService(): ClaudeVisionService {
  if (!visionServiceInstance) {
    visionServiceInstance = new ClaudeVisionService();
  }
  return visionServiceInstance;
}

export default ClaudeVisionService;
