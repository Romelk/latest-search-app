/**
 * Tool Registry for Claude Tool Use
 * Manages tool registration and execution
 */

import type { ToolSchema, ToolFunction } from '../types/agent';

export class ToolRegistry {
  private tools: Map<string, ToolFunction>;
  private schemas: ToolSchema[];

  constructor() {
    this.tools = new Map();
    this.schemas = [];
  }

  /**
   * Register a tool with its function and schema
   */
  register(
    name: string,
    description: string,
    inputSchema: {
      type: 'object';
      properties: Record<string, any>;
      required?: string[];
    },
    fn: ToolFunction
  ): void {
    this.tools.set(name, fn);
    this.schemas.push({
      name,
      description,
      input_schema: inputSchema
    });
    console.log(`🔧 Registered tool: ${name}`);
  }

  /**
   * Get all tool schemas for Claude API
   */
  getToolSchemas(): ToolSchema[] {
    return this.schemas;
  }

  /**
   * Execute a registered tool
   */
  async execute(toolName: string, toolInput: any): Promise<any> {
    const toolFn = this.tools.get(toolName);

    if (!toolFn) {
      throw new Error(`Tool not found: ${toolName}`);
    }

    console.log(`⚙️  Executing tool: ${toolName}`);
    console.log(`📥 Input:`, JSON.stringify(toolInput, null, 2).substring(0, 200));

    try {
      const result = await toolFn(toolInput);
      console.log(`✅ Tool ${toolName} completed`);
      return result;
    } catch (error) {
      console.error(`❌ Tool ${toolName} failed:`, error);
      throw error;
    }
  }

  /**
   * Check if a tool exists
   */
  hasTool(toolName: string): boolean {
    return this.tools.has(toolName);
  }

  /**
   * Get list of registered tool names
   */
  getToolNames(): string[] {
    return Array.from(this.tools.keys());
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size;
  }
}

export default ToolRegistry;
