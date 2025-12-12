/**
 * Fashion Trends Tools
 * Makes HTTP calls to Python backend for trends data
 */

import { config } from '../config';
import { ToolRegistry } from './ToolRegistry';
import { PythonErrorResponse, TrendsResponse } from '../types/pythonBackend';

/**
 * Get fashion trends from database via Python backend
 */
async function getFashionTrends(input: {
  region?: string;
  occasion_type?: string;
  limit?: number;
}): Promise<any> {
  const { region = 'Global', occasion_type, limit = 10 } = input;

  console.log(`📊 Calling Python backend to get fashion trends...`);

  // Build query params
  const params = new URLSearchParams();
  if (region) params.append('region', region);
  if (occasion_type) params.append('occasion_type', occasion_type);
  if (limit) params.append('limit', limit.toString());

  const response = await fetch(
    `${config.pythonBackendUrl}/api/trends?${params.toString()}`
  );

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ detail: 'Unknown error' })) as PythonErrorResponse;
    throw new Error(`Trends query failed: ${errorData.detail}`);
  }

  const data = await response.json() as TrendsResponse;

  return {
    trends: data.trends || [],
    count: data.count || 0,
    region: data.region || region,
    filters_applied: {
      region,
      occasion_type,
      limit
    }
  };
}

/**
 * Get backend statistics
 */
async function getBackendStats(): Promise<any> {
  console.log(`📊 Getting Python backend statistics...`);

  const response = await fetch(`${config.pythonBackendUrl}/stats`);

  if (!response.ok) {
    throw new Error('Failed to get backend stats');
  }

  const data = await response.json();
  return data;
}

/**
 * Register all trends-related tools
 */
export function registerTrendsTools(registry: ToolRegistry): void {
  registry.register(
    'get_fashion_trends',
    'Get current fashion trends from the database. Use this to inform styling recommendations with up-to-date trend information. You can filter by region and occasion type.',
    {
      type: 'object',
      properties: {
        region: {
          type: 'string',
          description: 'Geographic region for trends (e.g., "North America", "Europe", "Asia", "Global")',
        },
        occasion_type: {
          type: 'string',
          description: 'Type of occasion (e.g., "Casual", "Formal", "Business", "Party", "Wedding")',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of trends to return (default: 10)',
        }
      }
    },
    getFashionTrends
  );

  console.log('✅ Trends tools registered');
}
