import { Router, Request, Response } from 'express';
import { callGeminiJSON } from '../services/vertexai.service';
import { searchProducts, getDealsProducts, getTopSellingProducts } from '../services/bigquery.service';
import {
  buildIntentPrompt,
  buildClarifierPrompt,
  buildExplainerPrompt,
  buildExplainResultsPrompt,
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
    res.status(500).json({ error: 'Internal server error' });
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
    const searchFilters: SearchFilters = {
      ...filters,
    };

    // Extract filters from entities
    if (entities) {
      if (entities.category) searchFilters.category = entities.category;
      if (entities.color) searchFilters.color = entities.color;
      if (entities.size) searchFilters.size = entities.size;
      if (entities.brand) searchFilters.brand = entities.brand;
      if (entities.fit) searchFilters.fit = entities.fit;
      if (entities.style) searchFilters.style = entities.style;
      if (entities.occasion) searchFilters.occasion = [entities.occasion];
    }

    const results = await searchProducts(query, searchFilters, 20);

    const response: SearchResultsResponse = {
      results,
      total: results.length,
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
    const { session_id, query, entities }: ClarifyGoalRequest = req.body;

    if (!session_id || !query || !entities) {
      return res.status(400).json({ error: 'session_id, query, and entities are required' });
    }

    const prompt = buildClarifierPrompt(query, entities);
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

    // Extract participants and create outfit slots
    const participants = entities.participants || 'self';
    const palette = choice.palette || entities.palette || 'neutral tones';
    const occasion = entities.occasion || 'casual outing';

    // Define outfit slots based on participants
    // For simplicity, we'll create 2-3 looks
    const looks: Look[] = [];

    // Look 1: Smart Evening
    const look1Items: Product[] = [];

    // Search for man's items
    const manTop = await searchProducts('shirt', {
      color: palette.includes('blue') ? 'blue' : 'white',
      fit: 'regular',
      style: 'formal',
    }, 1);
    if (manTop.length > 0) {
      look1Items.push({
        ...manTop[0],
        for: 'man',
      } as any);
    }

    const manBottom = await searchProducts('trousers', {
      color: 'navy',
      fit: 'regular',
      style: 'formal',
    }, 1);
    if (manBottom.length > 0) {
      look1Items.push({
        ...manBottom[0],
        for: 'man',
      } as any);
    }

    // Search for woman's items
    const womanOutfit = await searchProducts('kurti', {
      color: palette.includes('beige') ? 'beige' : 'white',
      fit: 'regular',
    }, 1);
    if (womanOutfit.length > 0) {
      look1Items.push({
        ...womanOutfit[0],
        for: 'woman',
      } as any);
    }

    const totalPrice1 = look1Items.reduce((sum, item) => sum + item.price, 0);

    // Get explanation for this look
    const look1Summary = `A ${palette} outfit for ${occasion} with items: ${look1Items.map(i => i.title).join(', ')}`;
    const explanation1 = await callGeminiJSON<{ reason: string }>(buildExplainerPrompt(query, look1Summary));

    looks.push({
      name: 'Smart Evening',
      total_price: totalPrice1,
      items: look1Items.map(item => ({
        for: (item as any).for,
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        image_url: item.image_url,
        brand: item.brand,
        category: item.category,
      })),
      reason: explanation1.reason,
    });

    // Look 2: Easy Day Out (more casual)
    const look2Items: Product[] = [];

    const manCasualTop = await searchProducts('shirt', {
      color: 'white',
      fit: 'regular',
      style: 'casual',
    }, 1);
    if (manCasualTop.length > 0) {
      look2Items.push({
        ...manCasualTop[0],
        for: 'man',
      } as any);
    }

    const manCasualBottom = await searchProducts('chinos', {
      color: 'grey',
      fit: 'comfort',
    }, 1);
    if (manCasualBottom.length > 0) {
      look2Items.push({
        ...manCasualBottom[0],
        for: 'man',
      } as any);
    }

    const womanCasualOutfit = await searchProducts('palazzo', {
      color: 'olive',
      fit: 'regular',
    }, 1);
    if (womanCasualOutfit.length > 0) {
      look2Items.push({
        ...womanCasualOutfit[0],
        for: 'woman',
      } as any);
    }

    const totalPrice2 = look2Items.reduce((sum, item) => sum + item.price, 0);

    const look2Summary = `A relaxed outfit for ${occasion} with items: ${look2Items.map(i => i.title).join(', ')}`;
    const explanation2 = await callGeminiJSON<{ reason: string }>(buildExplainerPrompt(query, look2Summary));

    looks.push({
      name: 'Easy Day Out',
      total_price: totalPrice2,
      items: look2Items.map(item => ({
        for: (item as any).for,
        product_id: item.product_id,
        title: item.title,
        price: item.price,
        image_url: item.image_url,
        brand: item.brand,
        category: item.category,
      })),
      reason: explanation2.reason,
    });

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
