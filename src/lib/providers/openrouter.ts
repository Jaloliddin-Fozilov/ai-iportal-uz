import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class OpenRouterProvider extends BaseProvider {
  readonly id: ProviderId = 'openrouter';
  readonly name = 'OpenRouter (Free Tier)';
  readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'meta-llama/llama-3.3-70b-instruct:free',
      'iportal-ai-reasoning': 'deepseek/deepseek-r1:free',
      'iportal-ai-pro': 'google/gemini-2.0-flash-exp:free',
      'iportal-ai-coder': 'qwen/qwen-2.5-coder-32b-instruct:free',
      'openrouter/free-auto': 'meta-llama/llama-3.3-70b-instruct:free',
    };
    return map[requestedModel] || requestedModel || 'meta-llama/llama-3.3-70b-instruct:free';
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
      {
        'HTTP-Referer': 'https://ai.iportal.uz',
        'X-Title': 'iportal-ai',
      },
      node
    );
  }
}
