/**
 * Cost Tracking Service
 *
 * Manages budget tracking and enforcement for the AI Fashion Toolkit.
 * Enforces a hard $100 limit per session to prevent cost overruns.
 *
 * Key Features:
 * - Track usage per session
 * - Calculate costs from token usage
 * - Enforce $100 budget cap
 * - Provide usage warnings at thresholds
 * - Store usage history in BigQuery
 */

import { BigQuery } from '@google-cloud/bigquery';
import { config } from '../config';
import { v4 as uuidv4 } from 'uuid';

const BUDGET_LIMIT = 100.0; // $100 hard limit
const WARNING_THRESHOLD_1 = 75.0; // First warning at $75
const WARNING_THRESHOLD_2 = 90.0; // Second warning at $90

export interface ToolkitUsage {
  usage_id: string;
  session_id: string;
  timestamp: Date;
  tool_name: string;
  cost_usd: number;
  image_count: number;
  input_tokens: number;
  output_tokens: number;
  metadata?: any;
}

export interface SessionUsageSummary {
  session_id: string;
  total_cost: number;
  remaining_budget: number;
  usage_percentage: number;
  warning_level: 'none' | 'approaching' | 'critical' | 'exceeded';
  can_proceed: boolean;
  total_requests: number;
  total_images: number;
}

let bigquery: BigQuery | null = null;

function getBigQuery(): BigQuery {
  if (!bigquery) {
    bigquery = new BigQuery({
      projectId: config.gcp.projectId,
    });
  }
  return bigquery;
}

export class CostTrackingService {
  private dataset: string;
  private usageTable: string;

  constructor() {
    this.dataset = config.bigquery.dataset;
    this.usageTable = 'toolkit_usage';
  }

  /**
   * Get current usage summary for a session
   *
   * @param sessionId Session identifier
   * @returns Usage summary with budget status
   */
  async getSessionUsage(sessionId: string): Promise<SessionUsageSummary> {
    const bq = getBigQuery();

    try {
      const query = `
        SELECT
          COUNT(*) as total_requests,
          SUM(cost_usd) as total_cost,
          SUM(image_count) as total_images,
          SUM(input_tokens) as total_input_tokens,
          SUM(output_tokens) as total_output_tokens
        FROM \`${config.gcp.projectId}.${this.dataset}.${this.usageTable}\`
        WHERE session_id = @session_id
      `;

      const [rows] = await bq.query({
        query,
        params: { session_id: sessionId },
        location: 'US',
      });

      const row = rows[0] || {
        total_requests: 0,
        total_cost: 0,
        total_images: 0,
      };

      const totalCost = parseFloat(row.total_cost || 0);
      const remainingBudget = Math.max(0, BUDGET_LIMIT - totalCost);
      const usagePercentage = (totalCost / BUDGET_LIMIT) * 100;

      // Determine warning level
      let warningLevel: 'none' | 'approaching' | 'critical' | 'exceeded' = 'none';
      if (totalCost >= BUDGET_LIMIT) {
        warningLevel = 'exceeded';
      } else if (totalCost >= WARNING_THRESHOLD_2) {
        warningLevel = 'critical';
      } else if (totalCost >= WARNING_THRESHOLD_1) {
        warningLevel = 'approaching';
      }

      return {
        session_id: sessionId,
        total_cost: totalCost,
        remaining_budget: remainingBudget,
        usage_percentage: Math.round(usagePercentage * 100) / 100,
        warning_level: warningLevel,
        can_proceed: totalCost < BUDGET_LIMIT,
        total_requests: parseInt(row.total_requests || 0),
        total_images: parseInt(row.total_images || 0),
      };
    } catch (error: any) {
      console.error('❌ Error fetching session usage:', error);
      throw new Error(`Failed to fetch session usage: ${error.message}`);
    }
  }

  /**
   * Check if a session can proceed with a new request
   * Throws an error if budget is exceeded
   *
   * @param sessionId Session identifier
   * @returns Usage summary if allowed to proceed
   * @throws Error if budget exceeded
   */
  async checkBudgetAndProceed(sessionId: string): Promise<SessionUsageSummary> {
    const usage = await this.getSessionUsage(sessionId);

    if (!usage.can_proceed) {
      throw new Error(
        `Budget limit of $${BUDGET_LIMIT} has been reached for this session. ` +
        `Total spent: $${usage.total_cost.toFixed(2)}. ` +
        `Please start a new session or contact support to increase your limit.`
      );
    }

    return usage;
  }

  /**
   * Record a toolkit usage event
   *
   * @param usage Usage details to record
   */
  async recordUsage(usage: Omit<ToolkitUsage, 'usage_id' | 'timestamp'>): Promise<void> {
    const bq = getBigQuery();

    try {
      const usageRecord: ToolkitUsage = {
        usage_id: uuidv4(),
        timestamp: new Date(),
        ...usage,
      };

      const query = `
        INSERT INTO \`${config.gcp.projectId}.${this.dataset}.${this.usageTable}\`
        (usage_id, session_id, timestamp, tool_name, cost_usd, image_count, input_tokens, output_tokens, metadata)
        VALUES
        (@usage_id, @session_id, @timestamp, @tool_name, @cost_usd, @image_count, @input_tokens, @output_tokens, @metadata)
      `;

      await bq.query({
        query,
        params: {
          usage_id: usageRecord.usage_id,
          session_id: usageRecord.session_id,
          timestamp: usageRecord.timestamp.toISOString(),
          tool_name: usageRecord.tool_name,
          cost_usd: usageRecord.cost_usd,
          image_count: usageRecord.image_count,
          input_tokens: usageRecord.input_tokens,
          output_tokens: usageRecord.output_tokens,
          metadata: usageRecord.metadata ? JSON.stringify(usageRecord.metadata) : null,
        },
        location: 'US',
      });

      console.log(`✅ Recorded usage: ${usage.tool_name} - $${usage.cost_usd.toFixed(4)}`);
    } catch (error: any) {
      console.error('❌ Error recording usage:', error);
      // Don't throw - we don't want to fail the user's request if logging fails
      console.warn('⚠️  Usage recording failed, but continuing request');
    }
  }

  /**
   * Get usage history for a session
   *
   * @param sessionId Session identifier
   * @param limit Maximum number of records to return
   * @returns Array of usage records
   */
  async getUsageHistory(sessionId: string, limit: number = 50): Promise<ToolkitUsage[]> {
    const bq = getBigQuery();

    try {
      const query = `
        SELECT
          usage_id,
          session_id,
          timestamp,
          tool_name,
          cost_usd,
          image_count,
          input_tokens,
          output_tokens,
          metadata
        FROM \`${config.gcp.projectId}.${this.dataset}.${this.usageTable}\`
        WHERE session_id = @session_id
        ORDER BY timestamp DESC
        LIMIT @limit
      `;

      const [rows] = await bq.query({
        query,
        params: {
          session_id: sessionId,
          limit,
        },
        location: 'US',
      });

      return rows.map((row: any) => ({
        usage_id: row.usage_id,
        session_id: row.session_id,
        timestamp: new Date(row.timestamp.value),
        tool_name: row.tool_name,
        cost_usd: parseFloat(row.cost_usd),
        image_count: parseInt(row.image_count || 0),
        input_tokens: parseInt(row.input_tokens || 0),
        output_tokens: parseInt(row.output_tokens || 0),
        metadata: row.metadata ? JSON.parse(row.metadata) : null,
      }));
    } catch (error: any) {
      console.error('❌ Error fetching usage history:', error);
      throw new Error(`Failed to fetch usage history: ${error.message}`);
    }
  }

  /**
   * Get aggregate statistics across all sessions (admin view)
   *
   * @returns Global usage statistics
   */
  async getGlobalStatistics(): Promise<{
    total_sessions: number;
    total_cost: number;
    total_requests: number;
    total_images_processed: number;
    average_cost_per_session: number;
  }> {
    const bq = getBigQuery();

    try {
      const query = `
        SELECT
          COUNT(DISTINCT session_id) as total_sessions,
          SUM(cost_usd) as total_cost,
          COUNT(*) as total_requests,
          SUM(image_count) as total_images_processed
        FROM \`${config.gcp.projectId}.${this.dataset}.${this.usageTable}\`
      `;

      const [rows] = await bq.query({
        query,
        location: 'US',
      });

      const row = rows[0] || {
        total_sessions: 0,
        total_cost: 0,
        total_requests: 0,
        total_images_processed: 0,
      };

      const totalSessions = parseInt(row.total_sessions || 0);
      const totalCost = parseFloat(row.total_cost || 0);

      return {
        total_sessions: totalSessions,
        total_cost: totalCost,
        total_requests: parseInt(row.total_requests || 0),
        total_images_processed: parseInt(row.total_images_processed || 0),
        average_cost_per_session: totalSessions > 0 ? totalCost / totalSessions : 0,
      };
    } catch (error: any) {
      console.error('❌ Error fetching global statistics:', error);
      throw new Error(`Failed to fetch global statistics: ${error.message}`);
    }
  }

  /**
   * Calculate estimated cost for an upcoming request
   * Based on average token usage per image
   *
   * @param imageCount Number of images to analyze
   * @returns Estimated cost in USD
   */
  estimateCost(imageCount: number): number {
    // Average token usage per image (empirical estimates):
    // - Input: ~800 tokens per image + 200 tokens for prompt
    // - Output: ~500 tokens for analysis response
    const avgInputTokensPerImage = 1000;
    const avgOutputTokens = 500;

    const totalInputTokens = avgInputTokensPerImage * imageCount;
    const inputCost = (totalInputTokens / 1_000_000) * 3.0; // $3 per MTok
    const outputCost = (avgOutputTokens / 1_000_000) * 15.0; // $15 per MTok

    return inputCost + outputCost;
  }
}

// Export singleton instance
let costTrackingInstance: CostTrackingService | null = null;

export function getCostTrackingService(): CostTrackingService {
  if (!costTrackingInstance) {
    costTrackingInstance = new CostTrackingService();
  }
  return costTrackingInstance;
}

export default CostTrackingService;
