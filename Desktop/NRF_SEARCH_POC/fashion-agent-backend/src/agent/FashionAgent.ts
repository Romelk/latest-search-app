/**
 * Fashion Agent - Autonomous styling agent with Claude tool use
 */

import Anthropic from '@anthropic-ai/sdk';
import type { MessageParam, ContentBlock, TextBlock, ToolUseBlock } from '@anthropic-ai/sdk/resources/messages';
import { ToolRegistry } from '../tools/ToolRegistry';
import { getSessionStore } from '../session/SessionStore';
import type { AgentChunkType } from '../types/agent';
import { config } from '../config';

export class FashionAgent {
  private client: Anthropic;
  private sessionId: string;
  private sessionStore = getSessionStore();
  private toolRegistry: ToolRegistry;

  constructor(sessionId: string, toolRegistry: ToolRegistry) {
    this.sessionId = sessionId;
    this.client = new Anthropic({ apiKey: config.claudeApiKey });
    this.toolRegistry = toolRegistry;
  }

  /**
   * Process a user message through the agentic loop
   * Returns an async generator that yields chunks for streaming
   */
  async *processMessage(userMessage: string): AsyncGenerator<AgentChunkType> {
    console.log(`\n${'='.repeat(70)}`);
    console.log(`📨 Processing message for session: ${this.sessionId}`);
    console.log(`💬 User: ${userMessage.substring(0, 100)}...`);
    console.log('='.repeat(70));

    // Add user message to history
    this.sessionStore.addMessage(this.sessionId, {
      role: 'user',
      content: userMessage
    });

    // Run the agentic loop
    yield* this.agentLoop();
  }

  /**
   * Strip large base64 images from tool results to reduce token count
   */
  private stripLargeImages(messages: MessageParam[]): MessageParam[] {
    return messages.map(msg => {
      if (msg.role === 'user' && Array.isArray(msg.content)) {
        // Check if this is a tool result message
        const strippedContent = msg.content.map((item: any) => {
          if (item.type === 'tool_result' && typeof item.content === 'string') {
            try {
              const parsed = JSON.parse(item.content);

              // If the result contains a large base64 image, strip it
              if (parsed.image_base64 && parsed.image_base64.length > 1000) {
                return {
                  ...item,
                  content: JSON.stringify({
                    ...parsed,
                    image_base64: '[IMAGE_STRIPPED_TO_SAVE_TOKENS]'
                  })
                };
              }
            } catch (e) {
              // Not JSON or parse error, return as-is
            }
          }
          return item;
        });

        return { ...msg, content: strippedContent };
      }
      return msg;
    });
  }

  /**
   * Core agentic loop with Claude tool use
   * Continues calling Claude until it returns a final text response
   */
  private async *agentLoop(): AsyncGenerator<AgentChunkType> {
    let loopCount = 0;
    const maxLoops = 10; // Prevent infinite loops

    while (loopCount < maxLoops) {
      loopCount++;
      console.log(`\n🔄 Agent loop iteration: ${loopCount}`);

      // Get conversation history (limit to last 10 messages to avoid token limits)
      let conversationHistory = this.sessionStore.getHistory(this.sessionId, 10);

      // Strip large base64 images from tool results to save tokens
      conversationHistory = this.stripLargeImages(conversationHistory);

      try {
        // Call Claude with tools
        const response = await this.client.messages.create({
          model: config.claudeModel,
          max_tokens: config.maxTokens,
          messages: conversationHistory,
          tools: this.toolRegistry.getToolSchemas()
        });

        console.log(`🤖 Claude stop_reason: ${response.stop_reason}`);

        // Add assistant response to history
        this.sessionStore.addMessage(this.sessionId, {
          role: 'assistant',
          content: response.content
        });

        // Process response content
        let hasToolUse = false;
        const toolResults: any[] = [];

        for (const block of response.content) {
          if (block.type === 'text') {
            // Text response - yield to user
            yield {
              type: 'text',
              content: (block as TextBlock).text
            };
          } else if (block.type === 'tool_use') {
            // Tool use - execute tool
            hasToolUse = true;
            const toolUse = block as ToolUseBlock;

            console.log(`🔧 Tool use detected: ${toolUse.name}`);

            // Notify user about tool use
            yield {
              type: 'tool_use',
              tool_name: toolUse.name,
              tool_input: toolUse.input
            };

            try {
              // Execute tool
              const toolResult = await this.toolRegistry.execute(
                toolUse.name,
                toolUse.input
              );

              // Collect tool result
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify(toolResult)
              });

              // Notify user about tool result
              yield {
                type: 'tool_result',
                tool_name: toolUse.name,
                result: toolResult
              };
            } catch (error: any) {
              console.error(`❌ Tool execution error:`, error);

              // Add error as tool result
              toolResults.push({
                type: 'tool_result',
                tool_use_id: toolUse.id,
                content: JSON.stringify({
                  error: error.message || 'Tool execution failed'
                }),
                is_error: true
              });

              yield {
                type: 'error',
                error: `Tool ${toolUse.name} failed: ${error.message}`
              };
            }
          }
        }

        // If tools were used, add results to history and continue loop
        if (hasToolUse) {
          this.sessionStore.addMessage(this.sessionId, {
            role: 'user',
            content: toolResults
          });
          continue; // Loop back to Claude with tool results
        }

        // No tools used - final response, exit loop
        console.log(`✅ Agent loop complete (${loopCount} iterations)`);
        yield { type: 'done' };
        break;

      } catch (error: any) {
        console.error('❌ Agent loop error:', error);
        yield {
          type: 'error',
          error: error.message || 'Agent processing failed'
        };
        break;
      }
    }

    if (loopCount >= maxLoops) {
      console.error('⚠️  Max loop iterations reached');
      yield {
        type: 'error',
        error: 'Agent loop exceeded maximum iterations'
      };
    }
  }

  /**
   * Get current conversation history
   */
  getHistory(): MessageParam[] {
    return this.sessionStore.getHistory(this.sessionId);
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.sessionStore.deleteSession(this.sessionId);
    this.sessionStore.createSession(this.sessionId);
    console.log(`🗑️  Cleared history for session: ${this.sessionId}`);
  }
}

export default FashionAgent;
