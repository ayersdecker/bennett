import type { AIProvider, Message, ChatOptions } from './types';

export class AnthropicProvider implements AIProvider {
  name = 'Anthropic';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: Message[], _options?: ChatOptions): Promise<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const userMessages = messages.filter((m) => m.role !== 'system');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: _options?.maxTokens ?? 2048,
        system: systemMessage?.content,
        messages: userMessages.map((m) => ({
          role: m.role,
          content: m.content,
        })),
      }),
    });

    if (!response.ok) {
      let detail = response.statusText;

      try {
        const errorBody = await response.json();
        detail = errorBody?.error?.message || errorBody?.message || detail;
      } catch {
        // Keep the HTTP status text if the response body is not JSON.
      }

      throw new Error(`Anthropic API error (${response.status}): ${detail}`);
    }

    const data = await response.json();

    const content = data.content?.[0]?.text;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('Anthropic API returned an empty response.');
    }

    return content;
  }
}
