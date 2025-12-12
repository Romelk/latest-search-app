/**
 * TypeScript type definitions for Fashion Agent
 */

import type { MessageParam, ContentBlock } from '@anthropic-ai/sdk/resources/messages';

export interface AgentConfig {
  sessionId: string;
  apiKey: string;
  pythonBackendUrl: string;
}

export interface ToolSchema {
  name: string;
  description: string;
  input_schema: {
    type: 'object';
    properties: Record<string, unknown>;
    required?: string[];
  };
}

export interface ToolResult {
  tool_use_id: string;
  type: 'tool_result';
  content: string | object;
  is_error?: boolean;
}

export interface AgentMessage {
  role: 'user' | 'assistant';
  content: string | ContentBlock[];
  timestamp?: Date;
}

export type AgentChunkType =
  | { type: 'text'; content: string }
  | { type: 'tool_use'; tool_name: string; tool_input: any }
  | { type: 'tool_result'; tool_name: string; result: any }
  | { type: 'done' }
  | { type: 'error'; error: string };

export interface SessionData {
  sessionId: string;
  conversationHistory: MessageParam[];
  userContext: Record<string, any>;
  createdAt: Date;
  lastActivity: Date;
}

// Tool function type
export type ToolFunction = (...args: any[]) => Promise<any>;

// Python backend endpoints
export interface PythonBackendEndpoints {
  health: string;
  stats: string;
  generateImage: string;
  generateMultiAngle: string;
  generateVariations: string;
  generateVideo: string;
}
