import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class GroqProvider extends BaseProvider {
  readonly id: ProviderId = 'groq';
  readonly name = 'Groq Cloud';
  readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'openai/gpt-oss-120b',
      'iportal-ai-fast': 'openai/gpt-oss-20b',
      'iportal-ai-pro': 'openai/gpt-oss-120b',
      'iportal-ai-coder': 'openai/gpt-oss-120b',
      'iportal-ai-reasoning': 'qwen/qwen3.6-27b',
      'groq/gpt-oss-120b': 'openai/gpt-oss-120b',
      'groq/gpt-oss-20b': 'openai/gpt-oss-20b',
      'groq/qwen3.6-27b': 'qwen/qwen3.6-27b',
      'groq/compound': 'groq/compound',
      'groq/llama-3.3-70b': 'openai/gpt-oss-120b',
      'groq/llama-3.1-8b': 'openai/gpt-oss-20b',
    };
    return map[requestedModel] || requestedModel || 'openai/gpt-oss-120b';
  }

  async chat(
    request: ChatCompletionRequest,
    keyItem: ProviderKeyItem,
    node?: WorkerNode | null
  ): Promise<ProviderResponse> {
    return this.standardOpenAIChat(
      this.baseUrl,
      keyItem.key,
      request,
      keyItem,
      undefined,
      node
    );
  }
}
