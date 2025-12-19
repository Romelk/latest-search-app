import { Router, Request, Response } from 'express';
import { callGemini, callGeminiJSON } from '../services/vertexai.service';
import { searchProducts, getDealsProducts, getTopSellingProducts, getOutfitRecommendations, getProductsByIds } from '../services/bigquery.service';
import {
  buildIntentPrompt,
  buildClarifierPrompt,
  buildExplainerPrompt,
  buildExplainResultsPrompt,
  buildSearchFulfillmentPrompt,
  buildValidateResultsPrompt,
  buildOutfitComposerPrompt,
  buildChatMessagePrompt,
  buildToolBasedIntentPrompt,
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
  ChatMessageRequest,
  ChatMessageResponse,
  ToolBasedIntentRequest,
  ToolBasedIntentResponse,
  FindMatchingTool,
  CompleteTheLookResponse,
  Outfit,
  OutfitItem,
} from '../types';
import { Entities, Chips } from '../types';

const router = Router();

/**
 * Generate context-aware chips based on conversation state
 *
 * This creates dynamic chip options based on what information we've already gathered:
 * - No shopping_for → Ask "Who are you shopping for?"
 * - shopping_for=family but no family_member_type → Ask which family member
 * - Have shopping_for but no gender → Ask gender
 * - Have gender but no occasion → Ask occasion
 */
function generateContextualChips(entities: Entities): Chips {
  const chips: Chips = {};

  // SMART FLOW: If occasion is already known (interview, formal event), skip shopping_for question
  const hasFormalOccasion = entities.occasion &&
    (entities.occasion === 'interview' ||
     entities.occasion === 'formal' ||
     entities.occasion === 'wedding');

  // Step 1: For formal occasions with no gender, ask gender directly
  if (hasFormalOccasion && !entities.gender) {
    chips.gender = ['Male', 'Female', 'Other', 'Prefer not to say'];
    return chips;
  }

  // Step 2: For formal occasions with gender but no style preference, ask style
  if (hasFormalOccasion && entities.gender && !entities.style_preference) {
    chips.style_preference = ['Casual', 'Semi-Casual', 'Formal'];
    return chips;
  }

  // Step 3: For formal occasions with style, suggest outfit components
  if (hasFormalOccasion && entities.gender && entities.style_preference === 'Formal') {
    chips.outfit_component = ['Formal Pants', 'Formal Shirt', 'Complete Outfit'];
    return chips;
  }

  // GENERIC FLOW: If we don't know who they're shopping for, ask that first
  if (!entities.shopping_for && !hasFormalOccasion) {
    chips.shopping_for = ['Myself', 'Family Member', 'Partner', 'Gift'];
    return chips;
  }

  // If shopping for family but don't know which member, ask that
  if (entities.shopping_for === 'family' && !entities.family_member_type && !entities.gender) {
    chips.family_member = ['Father/Brother', 'Mother/Sister', 'Grandparent'];
    return chips;
  }

  // If we don't have gender yet (and couldn't infer it), ask
  if (!entities.gender) {
    chips.gender = ['Men', 'Women'];
    return chips;
  }

  // If we have gender but no occasion, suggest occasions
  if (!entities.occasion) {
    chips.occasion = ['Formal', 'Casual', 'Work', 'Party', 'Travel', 'Athleisure'];
  }

  // Also show color and style options for refinement
  if (entities.category) {
    chips.color = ['Blue', 'Red', 'Green', 'Neutral'];
    chips.style = ['Classic', 'Modern', 'Trendy'];
  }

  return chips;
}

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

// POST /tool-based-intent - AI Agent with Tool Selection
router.post('/tool-based-intent', async (req: Request, res: Response) => {
  try {
    const { session_id, query, conversation_history, current_context }: ToolBasedIntentRequest = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📥 [/tool-based-intent] REQUEST');
    console.log('='.repeat(80));
    console.log('Session ID:', session_id);
    console.log('Query:', query);
    console.log('Conversation History:', conversation_history);
    console.log('Current Context:', JSON.stringify(current_context, null, 2));
    console.log('='.repeat(80) + '\n');

    if (!session_id || !query) {
      return res.status(400).json({ error: 'session_id and query are required' });
    }

    // Build conversation history string
    const historyString = conversation_history
      ?.map(msg => `${msg.role}: ${msg.message}`)
      .join('\n') || 'None';

    // Build the tool-based intent prompt with full context
    const prompt = buildToolBasedIntentPrompt(
      query,
      historyString,
      {
        query: current_context?.query,
        productCount: current_context?.products?.length || 0,
        entities: current_context?.entities,
        selectedChips: current_context?.selected_chips,
      }
    );

    console.log('🤖 [AI PROMPT]');
    console.log('Prompt length:', prompt.length, 'characters');
    console.log('First 500 chars:', prompt.substring(0, 500) + '...\n');

    // Let AI choose the appropriate tool
    const response = await callGeminiJSON<ToolBasedIntentResponse>(prompt);

    console.log('\n' + '='.repeat(80));
    console.log('📤 [/tool-based-intent] RESPONSE');
    console.log('='.repeat(80));
    console.log('Mode:', response.mode);
    console.log('Entities:', JSON.stringify(response.entities, null, 2));
    console.log('Tool Call:', JSON.stringify(response.tool_call, null, 2));
    console.log('Chips:', JSON.stringify(response.chips, null, 2));
    console.log('='.repeat(80) + '\n');

    console.log('🤖 AI Tool Selection:', {
      query,
      chosen_tool: response.tool_call?.tool,
      reasoning: response.tool_call?.reasoning,
    });

    res.json(response);
  } catch (error) {
    console.error('Error in /tool-based-intent:', error);

    // Fallback: Default to conversational response
    console.log('⚠️  Falling back to conversational response');
    res.json({
      mode: 'CLEAR',
      entities: {},
      tool_call: {
        tool: 'conversational_response',
        parameters: {
          message: "I'm here to help! What are you looking for today?",
          include_context: false,
        },
        reasoning: 'Fallback due to error',
      },
    } as ToolBasedIntentResponse);
  }
});

// POST /search-results
router.post('/search-results', async (req: Request, res: Response) => {
  try {
    const { session_id, query, entities, filters }: SearchRequest = req.body;

    if (!session_id || !query) {
      return res.status(400).json({ error: 'session_id and query are required' });
    }

    // Build search filters: entities first, then override with explicit filters
    // IMPORTANT: Chip selections (filters) take precedence over original query entities
    const searchFilters: SearchFilters = {};

    // 1. Start with entities from original query
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

    // 2. Override with explicit filters (chip selections take precedence)
    Object.assign(searchFilters, filters);

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

// GET /outfits/complete-the-look/:productId
// Returns complementary items and complete outfits for a product
router.get('/outfits/complete-the-look/:productId', async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;
    const limit = parseInt(req.query.limit as string) || 4;

    console.log(`🎨 Complete the Look request for product: ${productId}, limit: ${limit}`);

    // Get outfits containing this product from BigQuery
    const rawOutfits = await getOutfitRecommendations(productId);

    if (!rawOutfits || rawOutfits.length === 0) {
      console.log(`No outfits found for product ${productId}`);
      return res.json({
        outfits: [],
        complementary_items: [],
        total_outfits: 0,
      } as CompleteTheLookResponse);
    }

    console.log(`Found ${rawOutfits.length} outfits for product ${productId}`);

    // Extract all unique product IDs from outfits (excluding the current product)
    const allProductIds = new Set<string>();
    rawOutfits.forEach((outfit: any) => {
      outfit.items?.forEach((item: OutfitItem) => {
        if (item.product_id !== productId) {
          allProductIds.add(item.product_id);
        }
      });
    });

    // Fetch full product details for all complementary items
    const complementaryProducts = await getProductsByIds(Array.from(allProductIds));

    console.log(`Fetched ${complementaryProducts.length} complementary products`);

    // Enrich outfits with full product details
    const enrichedOutfits: Outfit[] = rawOutfits.slice(0, 3).map((outfit: any) => ({
      outfit_id: outfit.outfit_id,
      gender: outfit.gender,
      occasion: outfit.occasion,
      items: outfit.items || [],
      enriched_products: outfit.items
        ?.map((item: OutfitItem) =>
          complementaryProducts.find(p => p.product_id === item.product_id)
        )
        .filter(Boolean) || [],
    }));

    const response: CompleteTheLookResponse = {
      outfits: enrichedOutfits,
      complementary_items: complementaryProducts.slice(0, limit),
      total_outfits: rawOutfits.length,
    };

    res.json(response);
  } catch (error) {
    console.error('❌ Error in /outfits/complete-the-look:', error);
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

// POST /generate-chat-message
router.post('/generate-chat-message', async (req: Request, res: Response) => {
  try {
    const { session_id, intent_mode, action, context }: ChatMessageRequest = req.body;

    if (!session_id || !intent_mode || !action) {
      return res.status(400).json({ error: 'session_id, intent_mode, and action are required' });
    }

    // Build context string from the context object
    const contextString = JSON.stringify(context, null, 2);

    // Build the prompt using the chat message generation prompt
    const prompt = buildChatMessagePrompt(intent_mode, action, contextString);

    // Call Gemini to generate the message
    const message = await callGemini(prompt);

    // Return the generated message
    const response: ChatMessageResponse = {
      message: message.trim()
    };

    res.json(response);
  } catch (error) {
    console.error('Error in /generate-chat-message:', error);

    // Fallback message if AI generation fails
    res.status(500).json({
      message: "Hi! I'm here to help you find what you're looking for. What can I help you with today?"
    });
  }
});

// POST /execute-tool - Execute the selected tool
router.post('/execute-tool', async (req: Request, res: Response) => {
  try {
    const { session_id, tool_call, context } = req.body;

    console.log('\n' + '='.repeat(80));
    console.log('📥 [/execute-tool] REQUEST');
    console.log('='.repeat(80));
    console.log('Session ID:', session_id);
    console.log('Tool Call:', JSON.stringify(tool_call, null, 2));
    console.log('Context:', JSON.stringify(context, null, 2));
    console.log('='.repeat(80) + '\n');

    if (!session_id || !tool_call) {
      return res.status(400).json({ error: 'session_id and tool_call are required' });
    }

    const { tool, parameters } = tool_call;

    console.log(`🔧 Executing tool: ${tool}`, parameters);

    switch (tool) {
      case 'search_products': {
        // Execute standard product search
        const { query, filters } = parameters;
        const searchFilters: SearchFilters = filters || {};

        console.log('🔍 [search_products] Searching with:', { query, filters: searchFilters });
        const results = await searchProducts(query, searchFilters, 20);
        console.log('📊 [search_products] Found:', results.length, 'products');

        // Validate results: If 0 results, return conversational response instead
        if (results.length === 0) {
          console.log(`⚠️  No products found for query: "${query}"`);
          const responseData = {
            tool: 'conversational_response',
            results: {
              message: `I couldn't find any products matching "${query}". Would you like to try a different search, or I can help you explore our categories?`,
              products: [],
              total: 0,
            },
          };

          console.log('\n' + '='.repeat(80));
          console.log('📤 [/execute-tool] RESPONSE (0 results fallback)');
          console.log('='.repeat(80));
          console.log(JSON.stringify(responseData, null, 2));
          console.log('='.repeat(80) + '\n');

          return res.json(responseData);
        }

        const responseData = {
          tool: 'search_products',
          results: {
            products: results,
            total: results.length,
          },
        };

        console.log('\n' + '='.repeat(80));
        console.log('📤 [/execute-tool] RESPONSE (search_products)');
        console.log('='.repeat(80));
        console.log('Total Products:', results.length);
        console.log('First 3 Products:', results.slice(0, 3).map(p => ({ id: p.product_id, title: p.title, category: p.category, color: p.color })));
        console.log('='.repeat(80) + '\n');

        return res.json(responseData);
      }

      case 'find_matching': {
        // Find complementary/matching items
        const params = parameters as FindMatchingTool;
        const { reference_context, target_category, preserve, vary } = params;

        // Build filters from preserved attributes
        const searchFilters: SearchFilters = {};

        // CRITICAL: Auto-preserve gender if context has products with gender
        // This prevents showing women's bottoms when user searched for men's tops
        if (context?.products && context.products.length > 0) {
          const firstProduct = context.products[0];
          if (firstProduct.gender && !preserve.includes('gender')) {
            searchFilters.gender = firstProduct.gender;
            console.log(`🔒 Auto-preserved gender from context: ${firstProduct.gender}`);
          }
        }

        // Add preserved attributes as filters (not query terms)
        preserve.forEach(attr => {
          const value = reference_context[attr as keyof typeof reference_context];
          if (value && attr !== 'category') { // Don't preserve category - we're changing it
            searchFilters[attr as keyof SearchFilters] = value as any;
          }
        });

        // Build query string from preserved values + target category
        // Let semantic search in BigQuery find the right products
        const preservedValues: string[] = [];
        preserve.forEach(attr => {
          const value = reference_context[attr as keyof typeof reference_context];
          if (value) {
            preservedValues.push(value);
          }
        });

        // Query: "formal pant" - let semantic search handle singular/plural/synonyms
        const fullQuery = preservedValues.length > 0
          ? `${preservedValues.join(' ')} ${target_category}`
          : target_category;

        console.log(`🔍 Finding matching ${target_category}:`, {
          query: fullQuery,
          filters: searchFilters,
          preserve,
          preserved_values: preservedValues,
          vary,
        });

        const results = await searchProducts(fullQuery, searchFilters, 20);

        console.log(`✅ Found ${results.length} matching products for query: "${fullQuery}"`);

        // Generate chips dynamically from actual product data
        const chips: any = {};
        vary.forEach(attr => {
          if (results.length > 0) {
            // Extract unique values from actual products
            const uniqueValues = [...new Set(
              results
                .map(p => p[attr as keyof typeof p])
                .filter(v => v && v !== '') // Filter out null/empty values
            )];

            if (uniqueValues.length > 0) {
              chips[attr] = uniqueValues.slice(0, 10); // Limit to top 10 options
            }
          }
        });

        return res.json({
          tool: 'find_matching',
          results: {
            products: results,
            total: results.length,
            chips,
            context: {
              preserved_attributes: preserve.reduce((acc, attr) => {
                acc[attr] = reference_context[attr as keyof typeof reference_context];
                return acc;
              }, {} as Record<string, any>),
              varied_attributes: vary,
            },
          },
        });
      }

      case 'refine_with_chips': {
        // Suggest chip-based refinement
        const { message, suggest_chips } = parameters;

        return res.json({
          tool: 'refine_with_chips',
          results: {
            message,
            suggest_chips: suggest_chips || [],
            should_highlight_chips: true,
          },
        });
      }

      case 'conversational_response': {
        // Pure conversational response with context-aware chips
        const { message, include_context } = parameters;

        // Generate context-aware chips based on current context entities
        const currentEntities = context?.entities || {};
        const contextChips = generateContextualChips(currentEntities);

        console.log('💬 [conversational_response] Generating response');
        console.log('   Message:', message);
        console.log('   Current Entities:', currentEntities);
        console.log('   Generated Chips:', contextChips);

        // Generate appropriate message based on which chips are being shown
        let conversationalMessage = message;

        // If no message provided, generate one based on the chips
        if (!message || message.trim() === '') {
          const chipCategories = Object.keys(contextChips);

          if (chipCategories.includes('style_preference')) {
            conversationalMessage = "Great! What style are you looking for?";
          } else if (chipCategories.includes('outfit_component')) {
            conversationalMessage = "Perfect! You'll need a formal pant and a formal shirt. What would you like to see first?";
          } else if (chipCategories.includes('gender')) {
            conversationalMessage = "Would you be comfortable sharing your gender?";
          } else {
            conversationalMessage = "Let's continue setting up your search!";
          }
        }

        const responseData = {
          tool: 'conversational_response',
          results: {
            message: conversationalMessage,
            include_context: include_context || false,
            chips: contextChips, // Add contextual chips for user selection
          },
        };

        console.log('\n' + '='.repeat(80));
        console.log('📤 [/execute-tool] RESPONSE (conversational_response)');
        console.log('='.repeat(80));
        console.log(JSON.stringify(responseData, null, 2));
        console.log('='.repeat(80) + '\n');

        return res.json(responseData);
      }

      default:
        return res.status(400).json({ error: `Unknown tool: ${tool}` });
    }
  } catch (error) {
    console.error('Error in /execute-tool:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
