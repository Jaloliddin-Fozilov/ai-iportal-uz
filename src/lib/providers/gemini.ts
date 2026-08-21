import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class GeminiProvider extends BaseProvider {
  readonly id: ProviderId = 'gemini';
  readonly name = 'Google Gemini (AI Studio)';
  readonly baseUrl = 'https://generativelanguage.googleapis.com/v1beta/openai/chat/completions';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': 'gemini-2.0-flash',
      'iportal-ai-pro': 'gemini-2.0-flash',
      'iportal-ai-fast': 'gemini-1.5-flash',
      'gemini/gemini-2.0-flash': 'gemini-2.0-flash',
      'gemini/gemini-1.5-flash': 'gemini-1.5-flash',
    };
    return map[requestedModel] || requestedModel || 'gemini-2.0-flash';
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
