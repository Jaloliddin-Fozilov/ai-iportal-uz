import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class GroqProvider extends BaseProvider {
  readonly id: ProviderId = 'groq';
  readonly name = 'Groq Cloud';
  readonly baseUrl = 'https://api.groq.com/openai/v1/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'llama-3.3-70b-versatile',
      'iportal-ai-fast': 'llama-3.1-8b-instant',
      'iportal-ai-pro': 'llama-3.3-70b-versatile',
      'iportal-ai-coder': 'llama-3.3-70b-versatile',
      'groq/llama-3.3-70b': 'llama-3.3-70b-versatile',
      'groq/llama-3.1-8b': 'llama-3.1-8b-instant',
    };
    return map[requestedModel] || requestedModel || 'llama-3.3-70b-versatile';
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
