/**
 * Cost Tracker Middleware
 *
 * Express middleware to enforce budget limits before processing
 * AI Fashion Toolkit requests.
 *
 * Usage:
 *   app.post('/toolkit/analyze-style', checkBudget, async (req, res) => {...})
 */

import { Request, Response, NextFunction } from 'express';
import { getCostTrackingService, SessionUsageSummary } from '../services/costTracking.service';

// Extend Express Request to include session usage info
declare global {
  namespace Express {
    interface Request {
      sessionUsage?: SessionUsageSummary;
    }
  }
}

/**
 * Middleware to check if session can proceed based on budget
 * Attaches usage summary to request for downstream handlers
 */
export async function checkBudget(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Extract session_id from request
    // Priority: header > body > query > default
    const sessionId =
      req.headers['x-session-id'] as string ||
      req.body?.session_id ||
      req.query.session_id ||
      'default';

    if (!sessionId) {
      res.status(400).json({
        error: 'Missing session_id',
        message: 'Session identifier is required for toolkit requests',
      });
      return;
    }

    const costService = getCostTrackingService();

    // Check budget and get current usage
    const usage = await costService.checkBudgetAndProceed(sessionId);

    // Attach usage to request for downstream handlers
    req.sessionUsage = usage;

    // Add usage info to response headers for client visibility
    res.setHeader('X-Budget-Total', usage.total_cost.toFixed(2));
    res.setHeader('X-Budget-Remaining', usage.remaining_budget.toFixed(2));
    res.setHeader('X-Budget-Percentage', usage.usage_percentage.toFixed(1));
    res.setHeader('X-Budget-Warning', usage.warning_level);

    // Log warning if approaching limit
    if (usage.warning_level === 'approaching') {
      console.log(`⚠️  Session ${sessionId}: Approaching budget limit ($${usage.total_cost.toFixed(2)} / $100)`);
    } else if (usage.warning_level === 'critical') {
      console.log(`🚨 Session ${sessionId}: Critical budget usage ($${usage.total_cost.toFixed(2)} / $100)`);
    }

    next();
  } catch (error: any) {
    console.error('❌ Budget check failed:', error.message);

    // Check if error is budget exceeded
    if (error.message.includes('Budget limit')) {
      res.status(429).json({
        error: 'Budget exceeded',
        message: error.message,
        code: 'BUDGET_LIMIT_REACHED',
      });
      return;
    }

    // Other errors
    res.status(500).json({
      error: 'Budget check failed',
      message: 'Unable to verify budget status. Please try again.',
    });
  }
}

/**
 * Optional middleware to provide usage info without blocking
 * Useful for GET endpoints that show current usage
 */
export async function attachUsageInfo(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const sessionId =
      req.headers['x-session-id'] as string ||
      (typeof req.query.session_id === 'string' ? req.query.session_id : '') ||
      'default';

    const costService = getCostTrackingService();
    const usage = await costService.getSessionUsage(sessionId);

    req.sessionUsage = usage;

    // Add headers but don't block request
    res.setHeader('X-Budget-Total', usage.total_cost.toFixed(2));
    res.setHeader('X-Budget-Remaining', usage.remaining_budget.toFixed(2));
    res.setHeader('X-Budget-Percentage', usage.usage_percentage.toFixed(1));
    res.setHeader('X-Budget-Warning', usage.warning_level);

    next();
  } catch (error: any) {
    console.error('⚠️  Failed to attach usage info:', error.message);
    // Don't block request, just log and continue
    next();
  }
}

export default { checkBudget, attachUsageInfo };
