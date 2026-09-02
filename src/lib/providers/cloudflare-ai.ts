import { BaseProvider, ProviderResponse } from './base';
import { ChatCompletionRequest, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

export class CloudflareAIProvider extends BaseProvider {
  readonly id: ProviderId = 'cloudflare';
  readonly name = 'Cloudflare Workers AI';
  readonly baseUrl = 'https://api.cloudflare.com/client/v4/accounts';

  resolveModel(requestedModel: string): string {
    const map: Record<string, string> = {
      'iportal-ai': '@cf/mistralai/mistral-small-3.1-24b-instruct',
      'iportal-ai-fast': '@cf/openai/gpt-oss-20b',
      'iportal-ai-reasoning': '@cf/qwen/qwq-32b',
      'iportal-ai-coder': '@cf/mistralai/mistral-small-3.1-24b-instruct',
      'iportal-ai-pro': '@cf/mistralai/mistral-small-3.1-24b-instruct',
      'cloudflare/llama-3.3-70b': '@cf/mistralai/mistral-small-3.1-24b-instruct',
    };
    return map[requestedModel] || '@cf/mistralai/mistral-small-3.1-24b-instruct';
  }

  async chat(
    request: ChatCompletionRequest,
    keyItem: ProviderKeyItem,
    node?: WorkerNode | null
  ): Promise<ProviderResponse> {
    // Cloudflare key format can be "ACCOUNT_ID:API_TOKEN" or just "API_TOKEN" (with env ACCOUNT_ID)
    let accountId = process.env.CLOUDFLARE_ACCOUNT_ID || '';
    let apiToken = keyItem.key;

    if (keyItem.key.includes(':')) {
      const parts = keyItem.key.split(':');
      accountId = parts[0];
      apiToken = parts[1];
    }

    const modelName = this.resolveModel(request.model);
    const endpoint = `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/v1/chat/completions`;

    return this.standardOpenAIChat(
      endpoint,
      apiToken,
      {
        ...request,
        model: modelName,
      },
      keyItem,
      undefined,
      node
    );
  }
}
