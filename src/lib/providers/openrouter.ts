import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class OpenRouterProvider extends BaseProvider {
  readonly id: ProviderId = 'openrouter';
  readonly name = 'OpenRouter (Free Tier)';
  readonly baseUrl = 'https://openrouter.ai/api/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'nvidia/nemotron-3.5-lightning:free',
      'iportal-ai-fast': 'nvidia/nemotron-3.5-lightning:free',
      'iportal-ai-reasoning': 'nvidia/nemotron-3.5-lightning:free',
      'iportal-ai-pro': 'nvidia/nemotron-3.5-lightning:free',
      'iportal-ai-coder': 'nvidia/nemotron-3.5-lightning:free',
      'openrouter/free-auto': 'nvidia/nemotron-3.5-lightning:free',
    };
    return map[requestedModel] || 'nvidia/nemotron-3.5-lightning:free';
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
