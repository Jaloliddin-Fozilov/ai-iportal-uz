import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class MistralProvider extends BaseProvider {
  readonly id: ProviderId = 'mistral';
  readonly name = 'Mistral AI (Free Tier)';
  readonly baseUrl = 'https://api.mistral.ai/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'mistral-small-latest',
      'iportal-ai-coder': 'codestral-latest',
      'mistral/mistral-small': 'mistral-small-latest',
    };
    return map[requestedModel] || requestedModel || 'mistral-small-latest';
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
