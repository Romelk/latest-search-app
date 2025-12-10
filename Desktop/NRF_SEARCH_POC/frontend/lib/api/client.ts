import { Entities, Product, Look, SearchFilters } from '../types';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

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
  entities: Entities
): Promise<{ question: string; options: string[] }> {
  const response = await fetch(`${API_URL}/clarify-goal`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, query, entities }),
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
