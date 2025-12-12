/**
 * Compatibility Checker Tool
 *
 * Feature 2: "Do These Match?"
 * Analyzes two clothing items to determine if they work well together
 */

import { getClaudeVisionService, ImageInput } from '../../services/claudeVision.service';
import { getCostTrackingService } from '../../services/costTracking.service';
import { CompatibilityResult } from '../../types/toolkit';

export interface CompatibilityCheckerInput {
  session_id: string;
  image1: ImageInput;
  image2: ImageInput;
}

export interface CompatibilityCheckerOutput {
  analysis: CompatibilityResult;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cost_usd: number;
  };
}

export class CompatibilityCheckerTool {
  private visionService = getClaudeVisionService();
  private costService = getCostTrackingService();

  /**
   * Check if two clothing items are compatible
   */
  async analyze(input: CompatibilityCheckerInput): Promise<CompatibilityCheckerOutput> {
    console.log(`\n🔄 Compatibility Checker: Processing 2 images for session ${input.session_id}`);

    try {
      // Call Claude Vision service with both images
      const result = await this.visionService.checkOutfitCompatibility(
        input.image1,
        input.image2
      );

      // Record usage in BigQuery
      await this.costService.recordUsage({
        session_id: input.session_id,
        tool_name: 'compatibility_checker',
        cost_usd: result.usage.cost_usd,
        image_count: 2,
        input_tokens: result.usage.input_tokens,
        output_tokens: result.usage.output_tokens,
        metadata: {
          compatibility_score: result.analysis.compatibility_score,
          overall_verdict: result.analysis.overall_verdict,
        },
      });

      console.log(`   ✅ Compatibility check complete`);
      console.log(`   📊 Score: ${result.analysis.compatibility_score}/100`);
      console.log(`   🎯 Verdict: ${result.analysis.overall_verdict}`);

      return {
        analysis: result.analysis as CompatibilityResult,
        usage: result.usage,
      };
    } catch (error: any) {
      console.error('❌ Compatibility Checker error:', error.message);
      throw new Error(`Compatibility check failed: ${error.message}`);
    }
  }

  /**
   * Get tool metadata for registration
   */
  static getMetadata() {
    return {
      name: 'compatibility_checker',
      displayName: 'Outfit Compatibility Checker',
      description:
        'Upload photos of two clothing items and get AI analysis on how well they match. Includes color harmony, style coherence, and styling tips.',
      category: 'analysis',
      requiresImages: 2,
      estimatedCost: 0.06,
      icon: '🔄',
    };
  }
}

export default CompatibilityCheckerTool;
