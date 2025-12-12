/**
 * AI Fashion Toolkit Routes
 *
 * Endpoints for all 5 AI toolkit features:
 * 1. Style Analyzer
 * 2. Compatibility Checker (future)
 * 3. Visual Search (future)
 * 4. Try-On Visualization (future)
 * 5. Style Profile Builder (future)
 */

import { Router, Request, Response } from 'express';
import { checkBudget, attachUsageInfo } from '../middleware/costTracker.middleware';
import { getCostTrackingService } from '../services/costTracking.service';
import StyleAnalyzerTool from '../toolkit/tools/styleAnalyzer.tool';
import CompatibilityCheckerTool from '../toolkit/tools/compatibilityChecker.tool';
import { ToolkitResponse, ToolkitError } from '../types/toolkit';
import { ImageInput } from '../services/claudeVision.service';

const router = Router();

// ==================== Helper Functions ====================

/**
 * Validate base64 image data
 */
function validateImageData(imageData: string): boolean {
  if (!imageData || typeof imageData !== 'string') {
    return false;
  }
  // Check if it looks like base64 (alphanumeric + /+=)
  return /^[A-Za-z0-9+/=]+$/.test(imageData);
}

/**
 * Parse media type from data URL or default to jpeg
 */
function parseMediaType(dataUrl: string): ImageInput['mediaType'] {
  const match = dataUrl.match(/^data:image\/(jpeg|png|webp|gif);base64,/);
  if (match) {
    return `image/${match[1]}` as ImageInput['mediaType'];
  }
  return 'image/jpeg'; // default
}

/**
 * Extract base64 data from data URL
 */
function extractBase64(dataUrl: string): string {
  // If already base64 (no data URL prefix), return as-is
  if (!dataUrl.startsWith('data:')) {
    return dataUrl;
  }
  // Extract from data URL
  const base64Match = dataUrl.match(/base64,(.+)$/);
  return base64Match ? base64Match[1] : dataUrl;
}

// ==================== Feature 1: Style Analyzer ====================

/**
 * POST /toolkit/analyze-style
 *
 * Analyze an outfit photo to extract style attributes
 *
 * Request body:
 * {
 *   session_id: string;
 *   image: string; // Base64 or data URL
 * }
 */
router.post('/analyze-style', checkBudget, async (req: Request, res: Response) => {
  try {
    const { session_id, image } = req.body;

    // Validation
    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id',
        message: 'Session identifier is required',
      } as ToolkitError);
    }

    if (!image) {
      return res.status(400).json({
        error: 'Missing image',
        message: 'Image data is required',
      } as ToolkitError);
    }

    // Parse image data
    const base64Data = extractBase64(image);
    if (!validateImageData(base64Data)) {
      return res.status(400).json({
        error: 'Invalid image data',
        message: 'Image must be valid base64 encoded data',
      } as ToolkitError);
    }

    const mediaType = parseMediaType(image);
    const imageInput: ImageInput = {
      data: base64Data,
      mediaType,
    };

    // Execute style analysis
    const tool = new StyleAnalyzerTool();
    const result = await tool.analyze({
      session_id,
      image: imageInput,
    });

    // Get updated session usage
    const costService = getCostTrackingService();
    const sessionUsage = await costService.getSessionUsage(session_id);

    // Build response
    const response: ToolkitResponse = {
      success: true,
      tool_name: 'style_analyzer',
      result: result.analysis,
      usage: result.usage,
      session_usage: {
        total_cost: sessionUsage.total_cost,
        remaining_budget: sessionUsage.remaining_budget,
        usage_percentage: sessionUsage.usage_percentage,
        warning_level: sessionUsage.warning_level,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ /analyze-style error:', error);
    res.status(500).json({
      error: 'Analysis failed',
      message: error.message || 'Failed to analyze style',
    } as ToolkitError);
  }
});

// ==================== Session Usage ====================

/**
 * GET /toolkit/session/:session_id/usage
 *
 * Get current usage summary for a session
 */
router.get('/session/:session_id/usage', attachUsageInfo, async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;

    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id',
        message: 'Session identifier is required',
      } as ToolkitError);
    }

    const costService = getCostTrackingService();
    const usage = await costService.getSessionUsage(session_id);

    res.json({
      success: true,
      session_id,
      usage,
    });
  } catch (error: any) {
    console.error('❌ /session/usage error:', error);
    res.status(500).json({
      error: 'Failed to fetch usage',
      message: error.message,
    } as ToolkitError);
  }
});

/**
 * GET /toolkit/session/:session_id/history
 *
 * Get usage history for a session
 */
router.get('/session/:session_id/history', async (req: Request, res: Response) => {
  try {
    const { session_id } = req.params;
    const limit = parseInt(req.query.limit as string) || 50;

    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id',
        message: 'Session identifier is required',
      } as ToolkitError);
    }

    const costService = getCostTrackingService();
    const history = await costService.getUsageHistory(session_id, limit);

    res.json({
      success: true,
      session_id,
      history,
      count: history.length,
    });
  } catch (error: any) {
    console.error('❌ /session/history error:', error);
    res.status(500).json({
      error: 'Failed to fetch history',
      message: error.message,
    } as ToolkitError);
  }
});

// ==================== Tool Metadata ====================

/**
 * GET /toolkit/tools
 *
 * Get metadata for all available tools
 */
router.get('/tools', (req: Request, res: Response) => {
  const tools = [
    StyleAnalyzerTool.getMetadata(),
    CompatibilityCheckerTool.getMetadata(),
    // Future tools will be added here:
    // VisualSearchTool.getMetadata(),
    // TryOnTool.getMetadata(),
    // StyleProfileTool.getMetadata(),
  ];

  res.json({
    success: true,
    tools,
    count: tools.length,
  });
});

// ==================== Future Feature Placeholders ====================

/**
 * POST /toolkit/check-compatibility
 * Feature 2: Outfit Compatibility Checker
 *
 * Request body:
 * {
 *   session_id: string;
 *   image1: string; // Base64 or data URL
 *   image2: string; // Base64 or data URL
 * }
 */
router.post('/check-compatibility', checkBudget, async (req: Request, res: Response) => {
  try {
    const { session_id, image1, image2 } = req.body;

    // Validation
    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id',
        message: 'Session identifier is required',
      } as ToolkitError);
    }

    if (!image1 || !image2) {
      return res.status(400).json({
        error: 'Missing images',
        message: 'Two images are required for compatibility check',
      } as ToolkitError);
    }

    // Parse image 1
    const base64Data1 = extractBase64(image1);
    if (!validateImageData(base64Data1)) {
      return res.status(400).json({
        error: 'Invalid image1 data',
        message: 'Image 1 must be valid base64 encoded data',
      } as ToolkitError);
    }

    const mediaType1 = parseMediaType(image1);
    const imageInput1: ImageInput = {
      data: base64Data1,
      mediaType: mediaType1,
    };

    // Parse image 2
    const base64Data2 = extractBase64(image2);
    if (!validateImageData(base64Data2)) {
      return res.status(400).json({
        error: 'Invalid image2 data',
        message: 'Image 2 must be valid base64 encoded data',
      } as ToolkitError);
    }

    const mediaType2 = parseMediaType(image2);
    const imageInput2: ImageInput = {
      data: base64Data2,
      mediaType: mediaType2,
    };

    // Execute compatibility check
    const tool = new CompatibilityCheckerTool();
    const result = await tool.analyze({
      session_id,
      image1: imageInput1,
      image2: imageInput2,
    });

    // Get updated session usage
    const costService = getCostTrackingService();
    const sessionUsage = await costService.getSessionUsage(session_id);

    // Build response
    const response: ToolkitResponse = {
      success: true,
      tool_name: 'compatibility_checker',
      result: result.analysis,
      usage: result.usage,
      session_usage: {
        total_cost: sessionUsage.total_cost,
        remaining_budget: sessionUsage.remaining_budget,
        usage_percentage: sessionUsage.usage_percentage,
        warning_level: sessionUsage.warning_level,
      },
    };

    res.json(response);
  } catch (error: any) {
    console.error('❌ /check-compatibility error:', error);
    res.status(500).json({
      error: 'Compatibility check failed',
      message: error.message || 'Failed to check compatibility',
    } as ToolkitError);
  }
});

/**
 * POST /toolkit/visual-search
 * Feature 3: Visual Search
 * TODO: Implement in Week 2
 */
router.post('/visual-search', checkBudget, async (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Visual Search coming soon (Feature 3)',
  } as ToolkitError);
});

/**
 * POST /toolkit/try-on
 * Feature 4: Enhanced Try-On Visualization
 * TODO: Implement in Week 3
 */
router.post('/try-on', checkBudget, async (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Enhanced Try-On Visualization coming soon (Feature 4)',
  } as ToolkitError);
});

/**
 * POST /toolkit/build-style-profile
 * Feature 5: Personal Style Profile Builder
 * TODO: Implement in Week 3
 */
router.post('/build-style-profile', checkBudget, async (req: Request, res: Response) => {
  res.status(501).json({
    error: 'Not implemented',
    message: 'Personal Style Profile Builder coming soon (Feature 5)',
  } as ToolkitError);
});

export default router;
