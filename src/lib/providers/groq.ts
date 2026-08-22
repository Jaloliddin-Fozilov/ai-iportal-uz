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
    try {
      return await this.standardOpenAIChat(
        this.baseUrl,
        keyItem.key,
        request,
        keyItem,
        undefined,
        node
      );
    } catch (err: any) {
      const errMsg = err.message || '';
      // If request is too large for 120B (8k TPM limit), fallback to 20B (30k TPM limit) and trim context
      if (
        errMsg.includes('413') ||
        errMsg.includes('tokens per minute') ||
        errMsg.includes('rate_limit_exceeded') ||
        errMsg.includes('Request too large')
      ) {
        console.warn(`[Groq TPM Auto-Fallback] Switching to high-throughput model openai/gpt-oss-20b`);
        const fallbackRequest: ChatCompletionRequest = {
          ...request,
          model: 'openai/gpt-oss-20b',
          messages: request.messages.length > 4
            ? [request.messages[0], ...request.messages.slice(-4)]
            : request.messages,
        };

        return await this.standardOpenAIChat(
          this.baseUrl,
          keyItem.key,
          fallbackRequest,
          keyItem,
          undefined,
          node
        );
      }
      throw err;
    }
  }
}
