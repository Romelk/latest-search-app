/**
 * Style Analyzer Tool
 *
 * Feature 1: "Analyze My Style"
 * Analyzes outfit photos to extract style attributes and provide recommendations
 */

import { getClaudeVisionService, ImageInput } from '../../services/claudeVision.service';
import { getCostTrackingService } from '../../services/costTracking.service';
import { StyleAnalysisResult } from '../../types/toolkit';

export interface StyleAnalyzerInput {
  session_id: string;
  image: ImageInput;
}

export interface StyleAnalyzerOutput {
  analysis: StyleAnalysisResult;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
}

export class StyleAnalyzerTool {
  private visionService = getClaudeVisionService();
  private costService = getCostTrackingService();

  /**
   * Analyze an outfit photo to extract style attributes
   */
  async analyze(input: StyleAnalyzerInput): Promise<StyleAnalyzerOutput> {
    console.log(`\n👔 Style Analyzer: Processing image for session ${input.session_id}`);

    try {
      // Call Claude Vision service
      const result = await this.visionService.extractStyleAttributes(input.image);

      // Record usage in BigQuery
      await this.costService.recordUsage({
        session_id: input.session_id,
        tool_name: 'style_analyzer',
        cost_usd: result.usage.cost_usd,
        image_count: 1,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        metadata: {
          style_category: result.analysis.style_category,
          formality_score: result.analysis.formality_score,
        },
      });

      console.log(`   ✅ Style analysis complete`);
      console.log(`   📋 Category: ${result.analysis.style_category}`);
      console.log(`   🎨 Colors: ${result.analysis.dominant_colors?.slice(0, 3).join(', ')}`);
      console.log(`   📊 Formality: ${result.analysis.formality_score}/10`);

      return {
        analysis: result.analysis as StyleAnalysisResult,
        usage: result.usage,
      };
    } catch (error: any) {
      console.error('❌ Style Analyzer error:', error.message);
      throw new Error(`Style analysis failed: ${error.message}`);
    }
  }

  /**
   * Get tool metadata for registration
   */
  static getMetadata() {
    return {
      name: 'style_analyzer',
      displayName: 'Analyze My Style',
      description:
        'Upload a photo of your outfit and get AI-powered style analysis including colors, category, occasion suitability, and improvement tips.',
      category: 'analysis',
      requiresImages: 1,
      estimatedCost: 0.03,
      icon: '👔',
    };
  }
}

export default StyleAnalyzerTool;
