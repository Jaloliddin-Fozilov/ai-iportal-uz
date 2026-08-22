import { ChatCompletionRequest, ChatCompletionResponse, ProviderId, ProviderKeyItem, RealQuotaData, WorkerNode } from '../core/types';
import { CircuitBreaker } from '../core/circuitBreaker';
import { LoadBalancer } from '../core/balancer';
import { loadStore, saveStore } from '../storage/dataStore';

export interface ProviderResponse {
  stream?: ReadableStream<Uint8Array>;
  response?: ChatCompletionResponse;
  usedKey: ProviderKeyItem;
  usedNode: WorkerNode | null;
}

export function extractRealQuota(headers: Headers, status: number, errorText?: string): RealQuotaData {
  const quota: RealQuotaData = {
    httpStatus: status,
    lastChecked: Date.now(),
  };

  // Groq / OpenAI rate-limit headers
  const remReq = headers.get('x-ratelimit-remaining-requests');
  const limReq = headers.get('x-ratelimit-limit-requests');
  const remTok = headers.get('x-ratelimit-remaining-tokens');
  const limTok = headers.get('x-ratelimit-limit-tokens');
  const resetReq = headers.get('x-ratelimit-reset-requests');
  const resetTok = headers.get('x-ratelimit-reset-tokens');

  // Cerebras headers
  const cerebrasRemDay = headers.get('x-ratelimit-remaining-requests-day');
  const cerebrasLimDay = headers.get('x-ratelimit-limit-requests-day');
  const cerebrasRemMinTok = headers.get('x-ratelimit-remaining-tokens-minute');
  const cerebrasResetDay = headers.get('x-ratelimit-reset-requests-day');

  if (remReq !== null && !isNaN(parseInt(remReq, 10))) quota.remainingRequests = parseInt(remReq, 10);
  else if (cerebrasRemDay !== null && !isNaN(parseInt(cerebrasRemDay, 10))) quota.remainingRequests = parseInt(cerebrasRemDay, 10);

  if (limReq !== null && !isNaN(parseInt(limReq, 10))) quota.limitRequests = parseInt(limReq, 10);
  else if (cerebrasLimDay !== null && !isNaN(parseInt(cerebrasLimDay, 10))) quota.limitRequests = parseInt(cerebrasLimDay, 10);

  if (remTok !== null && !isNaN(parseInt(remTok, 10))) quota.remainingTokens = parseInt(remTok, 10);
  else if (cerebrasRemMinTok !== null && !isNaN(parseInt(cerebrasRemMinTok, 10))) quota.remainingTokens = parseInt(cerebrasRemMinTok, 10);

  if (limTok !== null && !isNaN(parseInt(limTok, 10))) quota.limitTokens = parseInt(limTok, 10);

  if (resetReq) quota.resetRequests = resetReq;
  else if (cerebrasResetDay) quota.resetRequests = `${cerebrasResetDay}s`;

  if (resetTok) quota.resetTokens = resetTok;

  if (status === 429) {
    quota.isRateLimited = true;
    quota.errorMessage = errorText || 'Rate limit reached';
    if (errorText?.includes('TPM') || errorText?.includes('Tokens per minute')) {
      quota.rateLimitType = 'minute_tpm';
    } else if (errorText?.includes('RPM') || errorText?.includes('Requests per minute')) {
      quota.rateLimitType = 'minute_rpm';
    } else if (errorText?.includes('RPD') || errorText?.includes('Requests per day') || errorText?.includes('quota') || errorText?.includes('RESOURCE_EXHAUSTED')) {
      quota.rateLimitType = 'daily_rpd';
    } else {
      quota.rateLimitType = 'general';
    }
  } else if (status >= 200 && status < 300) {
    quota.isRateLimited = false;
  }

  const retryAfter = headers.get('retry-after');
  if (retryAfter && !isNaN(parseInt(retryAfter, 10))) {
    quota.retryAfterSeconds = parseInt(retryAfter, 10);
    quota.isRateLimited = true;
  }

  return quota;
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
    const isStream = request.stream === true;

    const payload = {
      model: targetModel,
      messages: request.messages,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens,
      top_p: request.top_p ?? 0.9,
      stream: isStream,
    };

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
      ...extraHeaders,
    };

    const startTime = Date.now();
    const { response, usedNode } = await LoadBalancer.executeFetch(
      endpoint,
      {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
      },
      node
    );

    const latency = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      CircuitBreaker.recordKeyFailure(keyItem, response.status, errorText);

      // Record real live quota & rate-limit details
      const realQuota = extractRealQuota(response.headers, response.status, errorText);
      realQuota.latencyMs = latency;
      keyItem.realQuota = realQuota;

      try {
        saveStore(loadStore());
      } catch (_) {}

      throw new Error(`Provider [${this.id}] Error (${response.status}): ${errorText}`);
    }

    // Success: Record real quota data returned from live response headers
    CircuitBreaker.recordKeySuccess(keyItem);
    const realQuota = extractRealQuota(response.headers, response.status);
    realQuota.latencyMs = latency;
    keyItem.realQuota = realQuota;

    try {
      saveStore(loadStore());
    } catch (_) {}

    if (isStream) {
      if (!response.body) {
        throw new Error(`Provider [${this.id}] returned empty stream body`);
      }
      return {
        stream: response.body,
        usedKey: keyItem,
        usedNode,
      };
    } else {
      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch (parseErr) {
        // Fallback for SSE lines if provider returned streaming chunks
        if (text.includes('data:')) {
          const lines = text.split('\n').filter(l => l.startsWith('data:') && !l.includes('[DONE]'));
          const lastLine = lines[lines.length - 1];
          if (lastLine) {
            data = JSON.parse(lastLine.replace(/^data:\s*/, ''));
          }
        }
        if (!data) throw new Error(`Invalid JSON response from ${this.id}: ${text.slice(0, 150)}`);
      }

      return {
        response: data as ChatCompletionResponse,
        usedKey: keyItem,
        usedNode,
      };
    }
  }
}
