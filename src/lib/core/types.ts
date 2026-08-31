export type Role = 'system' | 'user' | 'assistant' | 'tool';

export interface ChatAttachment {
  id: string;
  name: string;
  type: 'image' | 'document' | 'code';
  mimeType: string;
  size: number;
  dataUrl?: string;
  content?: string;
}

export interface ChatMessage {
  role: Role;
  content: string;
  name?: string;
  attachments?: ChatAttachment[];
}

export interface ChatCompletionRequest {
  model: string;
  messages: ChatMessage[];
  temperature?: number;
  max_tokens?: number;
  top_p?: number;
  stream?: boolean;
  frequency_penalty?: number;
  presence_penalty?: number;
  stop?: string | string[];
}

export interface ChatCompletionChunkChoice {
  index: number;
  delta: {
    role?: Role;
    content?: string;
    reasoning_content?: string;
  };
  finish_reason: string | null;
}

export interface ChatCompletionChunk {
  id: string;
  object: 'chat.completion.chunk';
  created: number;
  model: string;
  choices: ChatCompletionChunkChoice[];
}

export interface ChatCompletionResponse {
  id: string;
  object: 'chat.completion';
  created: number;
  model: string;
  choices: {
    index: number;
    message: {
      role: Role;
      content: string;
      reasoning_content?: string;
    };
    finish_reason: string;
  }[];
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

export type ProviderId = 
  | 'groq' 
  | 'gemini' 
  | 'sambanova' 
  | 'cerebras' 
  | 'openrouter' 
  | 'mistral' 
  | 'cloudflare' 
  | 'huggingface';

export interface AIModelMeta {
  id: string;
  name: string;
  provider: ProviderId;
  realModelId: string;
  category: 'smart' | 'fast' | 'reasoning' | 'code' | 'general';
  description: string;
  contextWindow: number;
  speed: string; // e.g. "300 tok/s"
  isFree: boolean;
}

export interface WorkerNode {
  id: string;
  name: string;
  type: 'cloudflare' | 'deno' | 'vercel' | 'netlify' | 'render' | 'koyeb' | 'railway' | 'fly' | 'custom';
  url: string;
  secret?: string;
  status: 'online' | 'degraded' | 'offline';
  latencyMs?: number;
  lastChecked?: number;
  failureCount: number;
  cooldownUntil?: number;
}

export interface ApiKeyItem {
  id: string;
  key: string; // "ip-live-..."
  name: string;
  createdAt: number;
  lastUsedAt?: number;
  requestsCount: number;
  promptTokens?: number;
  completionTokens?: number;
  totalTokens?: number;
  status: 'active' | 'revoked';
  rateLimitPerMin?: number;
  scope?: 'all' | 'chat' | 'images';
}

export interface RealQuotaData {
  remainingRequests?: number;
  limitRequests?: number;
  remainingTokens?: number;
  limitTokens?: number;
  resetRequests?: string;
  resetTokens?: string;
  isRateLimited?: boolean;
  rateLimitType?: 'minute_tpm' | 'minute_rpm' | 'daily_rpd' | 'general';
  retryAfterSeconds?: number;
  lastChecked?: number;
  latencyMs?: number;
  httpStatus?: number;
  errorMessage?: string;
}

export interface ProviderKeyItem {
  id: string;
  provider: ProviderId;
  key: string;
  maskedKey: string;
  status: 'active' | 'cooling_down' | 'error';
  cooldownUntil?: number;
  errorReason?: string;
  successCount: number;
  failCount: number;
  lastUsedAt?: number;
  assignedNodeId?: string;
  realQuota?: RealQuotaData;
}
