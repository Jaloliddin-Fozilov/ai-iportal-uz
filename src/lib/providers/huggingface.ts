import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class HuggingFaceProvider extends BaseProvider {
  readonly id: ProviderId = 'huggingface';
  readonly name = 'Hugging Face Serverless';
  readonly baseUrl = 'https://router.huggingface.co/hf-inference/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'meta-llama/Llama-3.3-70B-Instruct',
      'iportal-ai-reasoning': 'deepseek-ai/DeepSeek-R1-Distill-Qwen-32B',
      'iportal-ai-coder': 'Qwen/Qwen2.5-Coder-32B-Instruct',
    };
    return map[requestedModel] || requestedModel || 'meta-llama/Llama-3.3-70B-Instruct';
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
