import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class SambaNovaProvider extends BaseProvider {
  readonly id: ProviderId = 'sambanova';
  readonly name = 'SambaNova Cloud';
  readonly baseUrl = 'https://api.sambanova.ai/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'Meta-Llama-3.3-70B-Instruct',
      'iportal-ai-reasoning': 'DeepSeek-R1-Distill-Llama-70B',
      'iportal-ai-coder': 'Qwen2.5-Coder-32B-Instruct',
      'sambanova/deepseek-r1-70b': 'DeepSeek-R1-Distill-Llama-70B',
      'sambanova/llama-3.3-70b': 'Meta-Llama-3.3-70B-Instruct',
    };
    return map[requestedModel] || requestedModel || 'Meta-Llama-3.3-70B-Instruct';
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
