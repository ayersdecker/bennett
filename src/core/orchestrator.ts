import { AIRouter } from './ai-router';
import { MCPBridge } from './mcp-bridge';
import type { Message } from '../providers/types';

export class Orchestrator {
  private aiRouter: AIRouter;
  private conversationHistory: Message[] = [];

  constructor(aiRouter: AIRouter, mcpBridge: MCPBridge) {
    this.aiRouter = aiRouter;
    // mcpBridge will be used when MCP tool calling is implemented
    void mcpBridge;
  }

  async sendMessage(
    userMessage: string,
    assistantName: string = 'Assistant'
  ): Promise<string> {
    this.conversationHistory.push({
      role: 'user',
      content: userMessage,
    });

    const systemPrompt = `You are ${assistantName}, a helpful personal AI assistant. You are concise, friendly, and helpful. Today is ${new Date().toLocaleDateString()}.`;

    const messages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...this.conversationHistory,
    ];

    try {
      const response = await this.aiRouter.chat(messages);
      this.conversationHistory.push({
        role: 'assistant',
        content: response,
      });
      return response;
    } catch (error) {
      throw new Error(`Failed to get AI response: ${error}`);
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }
}
