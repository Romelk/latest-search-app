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
import { VisualSearchTool } from '../toolkit/tools/visualSearch.tool';
import VirtualTryOnTool from '../toolkit/tools/virtualTryOn.tool';
import StyleProfileTool from '../toolkit/tools/styleProfile.tool';
import StyleProfileQuestionnaireTool from '../toolkit/tools/styleProfileQuestionnaire.tool';
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
  // Check if it's a valid data URL format: data:image/...;base64,...
  return /^data:image\/(jpeg|jpg|png|gif|webp);base64,/.test(imageData);
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

    // Validate image data BEFORE extracting base64
    if (!validateImageData(image)) {
      return res.status(400).json({
        error: 'Invalid image data',
        message: 'Image must be valid base64 encoded data (data:image/...;base64,...)',
      } as ToolkitError);
    }

    // Parse image data
    const base64Data = extractBase64(image);
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
    VisualSearchTool.getMetadata(),
    VirtualTryOnTool.getMetadata(),
    StyleProfileTool.getMetadata(),
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

    // Validate image 1 BEFORE extracting
    if (!validateImageData(image1)) {
      return res.status(400).json({
        error: 'Invalid image1 data',
        message: 'Image 1 must be valid base64 encoded data (data:image/...;base64,...)',
      } as ToolkitError);
    }

    // Parse image 1
    const base64Data1 = extractBase64(image1);
    const mediaType1 = parseMediaType(image1);
    const imageInput1: ImageInput = {
      data: base64Data1,
      mediaType: mediaType1,
    };

    // Validate image 2 BEFORE extracting
    if (!validateImageData(image2)) {
      return res.status(400).json({
        error: 'Invalid image2 data',
        message: 'Image 2 must be valid base64 encoded data (data:image/...;base64,...)',
      } as ToolkitError);
    }

    // Parse image 2
    const base64Data2 = extractBase64(image2);
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
 * Feature 3: Visual Search - Find Similar Items
 *
 * Request body:
 * {
 *   session_id: string;
 *   image?: string; // Base64 or data URL (user upload)
 *   product_id?: string; // Product ID (for product-based search)
 *   product_image_url?: string; // Product image URL
 *   filters?: {
 *     max_price?: number;
 *     min_price?: number;
 *     category?: string;
 *     color_match_mode?: 'exact' | 'complementary' | 'any';
 *   };
 *   limit?: number;
 * }
 */
router.post('/visual-search', checkBudget, async (req: Request, res: Response) => {
  try {
    const { session_id, image, product_id, product_image_url, filters, limit } = req.body;

    // Validation
    if (!session_id) {
      return res.status(400).json({
        error: 'Missing session_id',
        message: 'Session identifier is required',
      } as ToolkitError);
    }

    // Must have either user image OR product image URL
    if (!image && !product_image_url) {
      return res.status(400).json({
        error: 'Missing image data',
        message: 'Either image (user upload) or product_image_url must be provided',
      } as ToolkitError);
    }

    // Execute visual search
    const tool = VisualSearchTool.getInstance();
    const result = await tool.search({
      sessionId: session_id,
      imageDataUrl: image,
      productId: product_id,
      productImageUrl: product_image_url,
      filters,
      limit,
    });

    // Get updated session usage
    const costService = getCostTrackingService();
    const sessionUsage = await costService.getSessionUsage(session_id);

    // Build response
    const response: ToolkitResponse = {
      success: true,
      tool_name: 'visual_search',
      result: result.result,
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
    console.error('❌ /visual-search error:', error);
    res.status(500).json({
      error: 'Visual search failed',
      message: error.message || 'Failed to perform visual search',
    } as ToolkitError);
  }
});

/**
 * POST /toolkit/try-on
 * Feature 4: Virtual Try-On Analysis
 *
 * Analyzes fit and style compatibility between user photo and product
 *
 * Request body:
 * {
 *   session_id: string,
 *   user_image: string (base64 data URL),
 *   product_image: string (base64 data URL or URL),
 *   product_id?: string (optional)
 * }
 */
router.post('/try-on', checkBudget, async (req: Request, res: Response) => {
  try {
    const { session_id, user_image, product_image, product_id } = req.body;

    // Validation
    if (!session_id || typeof session_id !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'session_id is required',
      } as ToolkitError);
    }

    if (!user_image || typeof user_image !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'user_image is required',
      } as ToolkitError);
    }

    if (!product_image || typeof product_image !== 'string') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'product_image is required',
      } as ToolkitError);
    }

    // Validate user image format
    if (!validateImageData(user_image)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid user_image format. Must be base64 data URL (data:image/...;base64,...)',
      } as ToolkitError);
    }

    // Validate product image format (can be URL or base64)
    const isUrl = product_image.startsWith('http://') || product_image.startsWith('https://');
    if (!isUrl && !validateImageData(product_image)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Invalid product_image format. Must be URL or base64 data URL',
      } as ToolkitError);
    }

    // Perform try-on analysis
    const tool = VirtualTryOnTool.getInstance();
    const { result, usage } = await tool.analyzeFit({
      sessionId: session_id,
      userImage: user_image,
      productImage: product_image,
      productId: product_id,
    });

    // Get updated session usage
    const costTracker = getCostTrackingService();
    const sessionUsage = await costTracker.getSessionUsage(session_id);

    const response: ToolkitResponse = {
      success: true,
      tool_name: 'virtual_try_on',
      result,
      usage: {
        input_tokens: usage.input_tokens,
        output_tokens: usage.output_tokens,
        cost_usd: usage.cost_usd,
      },
      session_usage: sessionUsage,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Virtual try-on error:', error);
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message || 'Virtual try-on analysis failed',
    } as ToolkitError);
  }
});

/**
 * POST /toolkit/build-style-profile
 * Feature 5: Personal Style Profile Builder
 *
 * Analyzes 3-10 outfit images to build a comprehensive personal style profile
 *
 * Request body:
 * {
 *   session_id: string;
 *   images: string[]; // Array of base64 data URLs (3-10 images)
 * }
 */
router.post('/build-style-profile', checkBudget, async (req: Request, res: Response) => {
  try {
    const { session_id, images } = req.body;

    // Validation
    if (!session_id) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'session_id is required',
      } as ToolkitError);
    }

    if (!images || !Array.isArray(images)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'images must be an array of base64 data URLs',
      } as ToolkitError);
    }

    if (images.length < 3) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Style Profile requires at least 3 outfit images (you provided ' + images.length + ')',
      } as ToolkitError);
    }

    if (images.length > 10) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'Style Profile supports maximum 10 images (you provided ' + images.length + ')',
      } as ToolkitError);
    }

    // Validate each image
    for (let i = 0; i < images.length; i++) {
      if (!validateImageData(images[i])) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Image ${i + 1} is invalid. Must be base64 data URL (data:image/...;base64,...)`,
        } as ToolkitError);
      }
    }

    // Execute style profile generation
    const tool = StyleProfileTool.getInstance();
    const { result, usage } = await tool.generateProfile({
      sessionId: session_id,
      images,
    });

    // Get updated session usage
    const costTracker = getCostTrackingService();
    const sessionUsage = await costTracker.getSessionUsage(session_id);

    // Return success response
    res.json({
      success: true,
      tool_name: 'style_profile',
      result,
      usage,
      session_usage: sessionUsage,
    } as ToolkitResponse);
  } catch (error: any) {
    console.error('Style Profile error:', error);
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message || 'Style profile generation failed',
    } as ToolkitError);
  }
});

/**
 * Feature 5B: Style Profile Builder (Questionnaire-based)
 * POST /toolkit/build-style-profile-questionnaire
 */
router.post('/build-style-profile-questionnaire', checkBudget, async (req: Request, res: Response) => {
  try {
    const { session_id, responses } = req.body;

    // Validate session_id
    if (!session_id) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'session_id is required',
      } as ToolkitError);
    }

    // Validate responses object
    if (!responses || typeof responses !== 'object') {
      return res.status(400).json({
        error: 'Validation error',
        message: 'responses object is required',
      } as ToolkitError);
    }

    // Validate required fields
    const requiredFields = [
      'gender',
      'color_palette',
      'everyday_style',
      'formality',
      'fit_preference',
      'patterns',
      'favorite_season',
      'shopping_goal',
    ];

    for (const field of requiredFields) {
      if (!(field in responses)) {
        return res.status(400).json({
          error: 'Validation error',
          message: `Missing required field: ${field}`,
        } as ToolkitError);
      }
    }

    // Validate patterns is an array
    if (!Array.isArray(responses.patterns)) {
      return res.status(400).json({
        error: 'Validation error',
        message: 'patterns must be an array',
      } as ToolkitError);
    }

    console.log(`📝 Processing style profile questionnaire for session: ${session_id}`);

    // Execute style profile generation from questionnaire
    const tool = StyleProfileQuestionnaireTool.getInstance();
    const { result, usage } = await tool.generateProfile({
      sessionId: session_id,
      responses,
    });

    // Get updated session usage
    const costTracker = getCostTrackingService();
    const sessionUsage = await costTracker.getSessionUsage(session_id);

    const response: ToolkitResponse = {
      success: true,
      tool_name: 'style_profile_questionnaire',
      result,
      usage,
      session_usage: sessionUsage,
    };

    res.json(response);
  } catch (error: any) {
    console.error('Style Profile Questionnaire error:', error);
    res.status(500).json({
      error: 'Tool execution failed',
      message: error.message || 'Style profile generation failed',
    } as ToolkitError);
  }
});

export default router;
