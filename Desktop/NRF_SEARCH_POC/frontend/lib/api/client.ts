import { Entities, Product, Look, SearchFilters, IntentMode } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

export interface SearchFulfillment {
  fulfillment_type: 'exact' | 'partial' | 'none';
  matched_attributes: string[];
  missing_attributes: string[];
  user_message: string;
  suggestion?: string;
}

export async function detectIntent(sessionId: string, query: string) {
  const response = await fetch(`${API_URL}/search-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query }),
  });

  if (!response.ok) {
    throw new Error('Failed to detect intent');
  }

  return response.json();
}

export async function searchResults(
  sessionId: string,
  query: string,
  entities?: Entities,
  filters?: SearchFilters
): Promise<{ results: Product[]; total: number }> {
  const response = await fetch(`${API_URL}/search-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query, entities, filters }),
  });

  if (!response.ok) {
    throw new Error('Failed to search products');
  }

  return response.json();
}

export async function clarifyGoal(
  sessionId: string,
  query: string,
  entities: Entities,
  conversationHistory?: string
): Promise<{
  question: string;
  options: string[];
  gathering_info?: boolean;
  ready_to_compose?: boolean;
}> {
  const response = await fetch(`${API_URL}/clarify-goal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      query,
      entities,
      conversation_history: conversationHistory
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to clarify goal');
  }

  return response.json();
}

export async function composeOutfits(
  sessionId: string,
  query: string,
  entities: Entities,
  choice: Record<string, string>
): Promise<{ looks: Look[] }> {
  const response = await fetch(`${API_URL}/compose-outfits`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query, entities, choice }),
  });

  if (!response.ok) {
    throw new Error('Failed to compose outfits');
  }

  return response.json();
}

export async function explainResults(
  sessionId: string,
  query: string,
  topResults: Array<{
    product_id: string;
    title: string;
    rank: number;
    matched_attributes: string[];
  }>
): Promise<{ explanation: string[] }> {
  const response = await fetch(`${API_URL}/explain-results`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query, top_results: topResults }),
  });

  if (!response.ok) {
    throw new Error('Failed to explain results');
  }

  return response.json();
}

export async function getDeals(): Promise<{ products: Product[] }> {
  const response = await fetch(`${API_URL}/content/deals`);

  if (!response.ok) {
    throw new Error('Failed to fetch deals');
  }

  return response.json();
}

export async function getTopSelling(): Promise<{ products: Product[] }> {
  const response = await fetch(`${API_URL}/content/top-selling`);

  if (!response.ok) {
    throw new Error('Failed to fetch top selling products');
  }

  return response.json();
}

export async function getCategories(): Promise<{
  categories: Array<{
    id: string;
    name: string;
    description: string;
    image_url: string;
  }>;
}> {
  const response = await fetch(`${API_URL}/content/categories`);

  if (!response.ok) {
    throw new Error('Failed to fetch categories');
  }

  return response.json();
}

export async function logAnalyticsEvent(
  sessionId: string,
  eventName: string,
  metadata?: Record<string, any>
): Promise<void> {
  await fetch(`${API_URL}/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      event_name: eventName,
      timestamp: new Date().toISOString(),
      metadata,
    }),
  });
}

export async function generateChatMessage(
  sessionId: string,
  intentMode: IntentMode,
  action: 'search_complete' | 'chip_selected' | 'product_clicked' | 'conversation_start',
  context: {
    query?: string;
    product_count?: number;
    selected_chips?: Record<string, string>;
    product?: Product;
    conversation_history?: string;
  }
): Promise<{ message: string }> {
  const response = await fetch(`${API_URL}/generate-chat-message`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      intent_mode: intentMode,
      action,
      context,
    }),
  });

  if (!response.ok) {
    // Fallback message if API fails
    return {
      message: "Hi! I'm here to help you find what you're looking for. What can I help you with today?"
    };
  }

  return response.json();
}

// Tool-based Agent API

export interface ToolCall {
  tool: 'search_products' | 'find_matching' | 'refine_with_chips' | 'conversational_response';
  parameters: Record<string, any>;
  reasoning?: string;
}

export interface ToolBasedIntentResponse {
  mode: IntentMode;
  entities: Entities;
  chips?: any;
  tool_call?: ToolCall;
}

export async function detectIntentWithTools(
  sessionId: string,
  query: string,
  conversationHistory?: Array<{ role: 'user' | 'assistant'; message: string }>,
  currentContext?: {
    query?: string;
    products?: Product[];
    entities?: Entities;
    selected_chips?: Record<string, string[]>;
  }
): Promise<ToolBasedIntentResponse> {
  const response = await fetch(`${API_URL}/tool-based-intent`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      query,
      conversation_history: conversationHistory,
      current_context: currentContext,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to detect intent with tools');
  }

  return response.json();
}

export async function executeTool(
  sessionId: string,
  toolCall: ToolCall,
  context?: any
): Promise<any> {
  const response = await fetch(`${API_URL}/execute-tool`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      session_id: sessionId,
      tool_call: toolCall,
      context,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to execute tool');
  }

  return response.json();
}

// Outfit API

export async function getCompleteTheLook(
  productId: string,
  limit: number = 4
): Promise<import('../types').CompleteTheLookResponse> {
  const response = await fetch(
    `${API_URL}/outfits/complete-the-look/${productId}?limit=${limit}`
  );

  if (!response.ok) {
    throw new Error('Failed to fetch Complete the Look recommendations');
  }

  return response.json();
}
