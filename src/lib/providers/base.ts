import { ChatCompletionRequest, ChatCompletionResponse, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';
import { CircuitBreaker } from '../core/circuitBreaker';
import { LoadBalancer } from '../core/balancer';

export interface ProviderResponse {
  stream?: ReadableStream<Uint8Array>;
  response?: ChatCompletionResponse;
  usedKey: ProviderKeyItem;
  usedNode: WorkerNode | null;
}

export abstract class BaseProvider {
  abstract readonly id: ProviderId;
  abstract readonly name: string;
  abstract readonly baseUrl: string;

  /**
   * Translates incoming model string to provider's native model string
   */
  abstract resolveModel(requestedModel: string): string;

  /**
   * Executes the chat completion
   */
  abstract chat(
    request: ChatCompletionRequest,
    keyItem: ProviderKeyItem,
    node?: WorkerNode | null
  ): Promise<ProviderResponse>;

  /**
   * Helper to execute OpenAI-compatible chat completions
   */
  protected async standardOpenAIChat(
    endpoint: string,
    apiKey: string,
    request: ChatCompletionRequest,
    keyItem: ProviderKeyItem,
    extraHeaders?: Record<string, string>,
    node?: WorkerNode | null
  ): Promise<ProviderResponse> {
    const targetModel = this.resolveModel(request.model);
    const payload = {
      model: targetModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens,
      top_p: request.top_p ?? 0.9,
      stream: request.stream ?? true,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    };

    const { response, usedNode } = await LoadBalancer.executeFetch(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      node
    );

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      CircuitBreaker.recordKeyFailure(keyItem, response.status, errorText);
      throw new Error(`Provider [${this.id}] Error (${response.status}): ${errorText}`);
    }

    CircuitBreaker.recordKeySuccess(keyItem);

    if (request.stream) {
      if (!response.body) {
        throw new Error(`Provider [${this.id}] returned empty stream body`);
      }
      return {
        stream: response.body,
        usedKey: keyItem,
        usedNode,
      };
    } else {
      const data = await response.json();
      return {
        response: data as ChatCompletionResponse,
        usedKey: keyItem,
        usedNode,
      };
    }
  }
}
