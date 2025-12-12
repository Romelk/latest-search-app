import { Router, Request, Response } from 'express';
import { callGeminiJSON } from '../services/vertexai.service';
import { searchProducts, getDealsProducts, getTopSellingProducts } from '../services/bigquery.service';
import {
  buildIntentPrompt,
  buildClarifierPrompt,
  buildExplainerPrompt,
  buildExplainResultsPrompt,
  buildSearchFulfillmentPrompt,
  buildValidateResultsPrompt,
  buildOutfitComposerPrompt,
} from '../agents/prompts';
import {
  IntentRequest,
  IntentResponse,
  SearchRequest,
  SearchResultsResponse,
  ClarifyGoalRequest,
  ClarifyGoalResponse,
  ComposeOutfitsRequest,
  ComposeOutfitsResponse,
  ExplainResultsRequest,
  ExplainResultsResponse,
  AnalyticsEvent,
  Product,
  SearchFilters,
  Look,
} from '../types';

const router = Router();

// POST /search-intent
router.post('/search-intent', async (req: Request, res: Response) => {
  try {
    const { session_id, query }: IntentRequest = req.body;

    if (!session_id || !query) {
      return res.status(400).json({ error: 'session_id and query are required' });
    }

    const prompt = buildIntentPrompt(query);
    const response = await callGeminiJSON<IntentResponse>(prompt);

    console.log('Intent detected:', response.mode, 'for query:', query);

    res.json(response);
  } catch (error) {
    console.error('Error in /search-intent:', error);

    // Fallback: Default to CLEAR intent if AI fails
    console.log('⚠️  Falling back to CLEAR intent mode');
    res.json({
      mode: 'CLEAR',
      entities: {},
      chips: {},
      confidence: 0.5,
    } as IntentResponse);
  }
});

// POST /search-results
router.post('/search-results', async (req: Request, res: Response) => {
  try {
    const { session_id, query, entities, filters }: SearchRequest = req.body;

    if (!session_id || !query) {
      return res.status(400).json({ error: 'session_id and query are required' });
    }

    // Build search filters from entities and filters
    // AI-SMART: Only apply filters that are likely to have data in our catalog
    const searchFilters: SearchFilters = {
      ...filters,
    };

    // Extract filters from entities
    if (entities) {
      if (entities.category) searchFilters.category = entities.category;
      if (entities.color) searchFilters.color = entities.color;
      // SKIP SIZE AND FIT - Myntra CSV data doesn't have these populated
      // The fulfillment analysis will communicate this to users
      // if (entities.size) searchFilters.size = entities.size;
      // if (entities.fit) searchFilters.fit = entities.fit;
      if (entities.brand) searchFilters.brand = entities.brand;
      if (entities.style) searchFilters.style = entities.style;
      if (entities.occasion) searchFilters.occasion = [entities.occasion];
    }

    console.log(`🔍 Searching with smart filters:`, searchFilters);
    const results = await searchProducts(query, searchFilters, 20);

    // AI-powered result validation DISABLED FOR DEMO
    // Reason: Validation is incorrectly classifying products (e.g., shirts as deodorants)
    // causing false positives and filtering out good results
    let validatedResults = results;
    let fulfillment = undefined;

    if (results.length > 0) {
      try {
        // VALIDATION DISABLED - Skip to fulfillment check
        // const context = `Occasion: ${entities?.occasion || 'Not specified'}, Gender: ${entities?.gender || 'Not specified'}, Category: ${entities?.category || 'Any'}`;
        // const validationPrompt = buildValidateResultsPrompt(query, context, results.map(...));
        // const validation = await callGeminiJSON<{ valid_product_ids: string[]; reason: string }>(validationPrompt);
        // validatedResults = results.filter(r => validation.valid_product_ids.includes(r.product_id));

        // Check search fulfillment - did we actually find what they asked for?
        if (validatedResults.length > 0) {
          const requirements = `Color: ${entities?.color || 'Any'}, Size: ${entities?.size || 'Any'}, Category: ${entities?.category || 'Any'}, Fit: ${entities?.fit || 'Any'}`;

          const fulfillmentPrompt = buildSearchFulfillmentPrompt(
            query,
            requirements,
            validatedResults.slice(0, 5).map(r => ({
              product_id: r.product_id,
              title: r.title,
              category: r.category,
              color: r.color,
              size: r.size,
              fit: r.fit,
            }))
          );

          fulfillment = await callGeminiJSON<{
            fulfillment_type: 'exact' | 'partial' | 'none';
            matched_attributes: string[];
            missing_attributes: string[];
            user_message: string;
            suggestion?: string;
          }>(fulfillmentPrompt);

          if (fulfillment.fulfillment_type !== 'exact') {
            console.log(`💡 Search Fulfillment: ${fulfillment.fulfillment_type}`);
            console.log(`   Missing: ${fulfillment.missing_attributes.join(', ')}`);
            console.log(`   Message: ${fulfillment.user_message}`);
          }
        }
      } catch (error) {
        console.error('Error validating results:', error);
        // On validation error, return all results (fail open)
        validatedResults = results;
      }
    }

    const response: SearchResultsResponse = {
      results: validatedResults,
      total: validatedResults.length,
      fulfillment,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /search-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /clarify-goal
router.post('/clarify-goal', async (req: Request, res: Response) => {
  try {
    const { session_id, query, entities, conversation_history }: ClarifyGoalRequest = req.body;

    if (!session_id || !query || !entities) {
      return res.status(400).json({ error: 'session_id, query, and entities are required' });
    }

    const prompt = buildClarifierPrompt(query, entities, conversation_history);
    const response = await callGeminiJSON<ClarifyGoalResponse>(prompt);

    res.json(response);
  } catch (error) {
    console.error('Error in /clarify-goal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /compose-outfits
router.post('/compose-outfits', async (req: Request, res: Response) => {
  try {
    const { session_id, query, entities, choice }: ComposeOutfitsRequest = req.body;

    if (!session_id || !query || !entities) {
      return res.status(400).json({ error: 'session_id, query, and entities are required' });
    }

    // Extract context from entities and choice
    const participants = entities.participants || 'self';
    const occasion = entities.occasion || 'casual outing';
    const selectedStyle = choice.style || choice.palette || 'contemporary casual';
    const gender = entities.gender || 'Not specified';

    console.log(`Composing outfits for: ${occasion}, style: ${selectedStyle}, gender: ${gender}`);

    // Use AI to intelligently compose outfits based on the selected style
    const composerPrompt = buildOutfitComposerPrompt(
      query,
      occasion,
      selectedStyle,
      participants,
      gender,
      entities
    );

    interface OutfitItem {
      for: string;
      search_query: string;
      filters: SearchFilters;
    }

    interface ComposedLook {
      name: string;
      items: OutfitItem[];
    }

    const aiComposition = await callGeminiJSON<{ looks: ComposedLook[] }>(composerPrompt);

    // Now search for actual products based on AI's composition
    const looks: Look[] = [];

    for (const aiLook of aiComposition.looks) {
      const lookItems: Product[] = [];

      // Search for each item in this look
      for (const item of aiLook.items) {
        const products = await searchProducts(item.search_query, item.filters, 3);

        // For demo: Skip validation in outfit composition to avoid false positives
        // Validation is too aggressive and filters out good products
        if (products.length > 0) {
          lookItems.push({
            ...products[0],
            for: item.for,
          } as any);
        } else {
          console.log(`⚠️  No products found for: ${item.search_query}`);
        }
      }

      if (lookItems.length > 0) {
        const totalPrice = lookItems.reduce((sum, item) => sum + item.price, 0);

        // Get AI explanation for this look
        const lookSummary = `A ${selectedStyle} outfit for ${occasion} with items: ${lookItems.map(i => i.title).join(', ')}`;
        const explanation = await callGeminiJSON<{ reason: string }>(
          buildExplainerPrompt(query, lookSummary)
        );

        looks.push({
          name: aiLook.name,
          total_price: totalPrice,
          items: lookItems.map(item => ({
            for: (item as any).for,
            product_id: item.product_id,
            title: item.title,
            price: item.price,
            image_url: item.image_url,
            brand: item.brand,
            category: item.category,
          })),
          reason: explanation.reason,
        });
      }
    }

    const response: ComposeOutfitsResponse = {
      looks,
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /compose-outfits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /explain-results
router.post('/explain-results', async (req: Request, res: Response) => {
  try {
    const { session_id, query, top_results }: ExplainResultsRequest = req.body;

    if (!session_id || !query || !top_results) {
      return res.status(400).json({ error: 'session_id, query, and top_results are required' });
    }

    const prompt = buildExplainResultsPrompt(query, top_results);
    const response = await callGeminiJSON<ExplainResultsResponse>(prompt);

    res.json(response);
  } catch (error) {
    console.error('Error in /explain-results:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /content/deals
router.get('/content/deals', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await getDealsProducts(limit);
    res.json({ products });
  } catch (error) {
    console.error('Error in /content/deals:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /content/top-selling
router.get('/content/top-selling', async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;
    const products = await getTopSellingProducts(limit);
    res.json({ products });
  } catch (error) {
    console.error('Error in /content/top-selling:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /content/categories
router.get('/content/categories', async (req: Request, res: Response) => {
  try {
    const categories = [
      {
        id: 'fashion',
        name: 'Fashion and Lifestyle',
        description: 'Clothing, accessories, and fashion items',
        image_url: 'https://via.placeholder.com/300x200/E91E63/FFFFFF?text=Fashion',
      },
      {
        id: 'electronics',
        name: 'Electronics',
        description: 'Phones, laptops, and gadgets',
        image_url: 'https://via.placeholder.com/300x200/2196F3/FFFFFF?text=Electronics',
      },
      {
        id: 'furniture',
        name: 'Furniture',
        description: 'Home and office furniture',
        image_url: 'https://via.placeholder.com/300x200/4CAF50/FFFFFF?text=Furniture',
      },
      {
        id: 'others',
        name: 'Others',
        description: 'Explore more categories',
        image_url: 'https://via.placeholder.com/300x200/FF9800/FFFFFF?text=Others',
      },
    ];
    res.json({ categories });
  } catch (error) {
    console.error('Error in /content/categories:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /analytics/event
router.post('/analytics/event', async (req: Request, res: Response) => {
  try {
    const event: AnalyticsEvent = req.body;

    if (!event.session_id || !event.event_name || !event.timestamp) {
      return res.status(400).json({ error: 'session_id, event_name, and timestamp are required' });
    }

    // Log the event (in production, write to BigQuery or analytics platform)
    console.log('Analytics event:', event);

    res.json({ success: true });
  } catch (error) {
    console.error('Error in /analytics/event:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
