/**
 * In-memory session storage using Map
 * Can be upgraded to Redis later for production
 */

import type { SessionData } from '../types/agent';
import type { MessageParam } from '@anthropic-ai/sdk/resources/messages';

export class SessionStore {
  private sessions: Map<string, SessionData>;
  private sessionTTL: number;

  constructor(sessionTTL: number = 24 * 60 * 60 * 1000) {
    this.sessions = new Map();
    this.sessionTTL = sessionTTL;

    // Cleanup expired sessions every hour
    setInterval(() => this.cleanupExpiredSessions(), 60 * 60 * 1000);
  }

  /**
   * Create a new session
   */
  createSession(sessionId: string): SessionData {
    const sessionData: SessionData = {
      sessionId,
      conversationHistory: [],
      userContext: {},
      createdAt: new Date(),
      lastActivity: new Date()
    };

    this.sessions.set(sessionId, sessionData);
    console.log(`✅ Created session: ${sessionId}`);
    return sessionData;
  }

  /**
   * Get session by ID
   */
  getSession(sessionId: string): SessionData | undefined {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.lastActivity = new Date();
    }
    return session;
  }

  /**
   * Get or create session
   */
  getOrCreateSession(sessionId: string): SessionData {
    let session = this.getSession(sessionId);
    if (!session) {
      session = this.createSession(sessionId);
    }
    return session;
  }

  /**
   * Add message to session history
   */
  addMessage(sessionId: string, message: MessageParam): void {
    const session = this.getOrCreateSession(sessionId);
    session.conversationHistory.push(message);
    session.lastActivity = new Date();
  }

  /**
   * Get conversation history (with optional pruning for recent messages)
   */
  getHistory(sessionId: string, maxMessages?: number): MessageParam[] {
    const session = this.getSession(sessionId);
    if (!session) return [];

    const history = session.conversationHistory;

    // If maxMessages is specified, keep only the most recent messages
    if (maxMessages && history.length > maxMessages) {
      // Keep the most recent N messages to stay within token limits
      return history.slice(-maxMessages);
    }

    return history;
  }

  /**
   * Update user context
   */
  updateContext(sessionId: string, context: Record<string, any>): void {
    const session = this.getOrCreateSession(sessionId);
    session.userContext = { ...session.userContext, ...context };
    session.lastActivity = new Date();
  }

  /**
   * Get user context
   */
  getContext(sessionId: string): Record<string, any> {
    const session = this.getSession(sessionId);
    return session?.userContext || {};
  }

  /**
   * Delete session
   */
  deleteSession(sessionId: string): void {
    this.sessions.delete(sessionId);
    console.log(`🗑️  Deleted session: ${sessionId}`);
  }

  /**
   * Cleanup expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let cleanedCount = 0;

    for (const [sessionId, session] of this.sessions.entries()) {
      const age = now - session.lastActivity.getTime();
      if (age > this.sessionTTL) {
        this.deleteSession(sessionId);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`🧹 Cleaned up ${cleanedCount} expired sessions`);
    }
  }

  /**
   * Get session statistics
   */
  getStats(): { totalSessions: number; activeSessions: number } {
    return {
      totalSessions: this.sessions.size,
      activeSessions: this.sessions.size // All in-memory sessions are active
    };
  }
}

// Singleton instance
let sessionStoreInstance: SessionStore | null = null;

export function getSessionStore(sessionTTL?: number): SessionStore {
  if (!sessionStoreInstance) {
    sessionStoreInstance = new SessionStore(sessionTTL);
  }
  return sessionStoreInstance;
}

export default SessionStore;
