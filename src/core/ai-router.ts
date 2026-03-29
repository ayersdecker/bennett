import type { AIProvider, Message, ChatOptions } from '../providers/types';
import { OpenAIProvider } from '../providers/openai';
import { AnthropicProvider } from '../providers/anthropic';

type ProviderType = 'openai' | 'anthropic';

export class AIRouter {
  private provider: AIProvider;

  constructor(providerType: ProviderType, apiKey: string) {
    this.provider = this.createProvider(providerType, apiKey);
  }

  private createProvider(type: ProviderType, apiKey: string): AIProvider {
    switch (type) {
      case 'openai':
        return new OpenAIProvider(apiKey);
      case 'anthropic':
        return new AnthropicProvider(apiKey);
      default:
        return new OpenAIProvider(apiKey);
    }
  }

  switchProvider(type: ProviderType, apiKey: string): void {
    this.provider = this.createProvider(type, apiKey);
  }

  async chat(messages: Message[], options?: ChatOptions): Promise<string> {
    return this.provider.chat(messages, options);
  }

  getProviderName(): string {
    return this.provider.name;
  }
}
