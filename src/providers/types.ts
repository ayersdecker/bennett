export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

export interface ChatOptions {
  tools?: MCPTool[];
  temperature?: number;
  maxTokens?: number;
}

export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, unknown>;
}

export interface AIProvider {
  name: string;
  chat(messages: Message[], options?: ChatOptions): Promise<string>;
}
