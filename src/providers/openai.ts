import type { AIProvider, Message, ChatOptions } from './types';

const OPENAI_MODEL = 'gpt-4o-mini';

export class OpenAIProvider implements AIProvider {
  name = 'OpenAI';
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async chat(messages: Message[], _options?: ChatOptions): Promise<string> {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages,
        temperature: _options?.temperature ?? 0.7,
        max_tokens: _options?.maxTokens ?? 2048,
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

      throw new Error(`OpenAI API error (${response.status}): ${detail}`);
    }

    const data = await response.json();

    const content = data.choices?.[0]?.message?.content;
    if (typeof content !== 'string' || !content.trim()) {
      throw new Error('OpenAI API returned an empty response.');
    }

    return content;
  }
}
