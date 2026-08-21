import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class CerebrasProvider extends BaseProvider {
  readonly id: ProviderId = 'cerebras';
  readonly name = 'Cerebras Inference';
  readonly baseUrl = 'https://api.cerebras.ai/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'llama3.1-70b',
      'iportal-ai-fast': 'llama3.1-8b',
      'cerebras/llama3.1-70b': 'llama3.1-70b',
      'cerebras/llama3.1-8b': 'llama3.1-8b',
    };
    return map[requestedModel] || requestedModel || 'llama3.1-70b';
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
