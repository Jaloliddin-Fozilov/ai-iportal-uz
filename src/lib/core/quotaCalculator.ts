import { ProviderId, RealQuotaData } from './types';

export interface ProviderQuotaInfo {
  provider: ProviderId;
  name: string;
  dailyRequestsLimit: number;
  dailyTokensLimit: number;
  rateLimitPerMin: number;
  tokensPerMin: number;
  resetInterval: string;
  notes: string;
}

export const PROVIDER_FREE_QUOTAS: Record<string, ProviderQuotaInfo> = {
  groq: {
    provider: 'groq',
    name: 'Groq Cloud LPU',
    dailyRequestsLimit: 1000, // Real Groq 70B free tier limit
    dailyTokensLimit: 500000,
    rateLimitPerMin: 30,
    tokensPerMin: 6000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1 000 ta so\'rov / 30 RPM / 6 000 TPM',
  },
  gemini: {
    provider: 'gemini',
    name: 'Google AI Studio (Gemini)',
    dailyRequestsLimit: 1500,
    dailyTokensLimit: 1000000,
    rateLimitPerMin: 15,
    tokensPerMin: 1000000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1 500 ta so\'rov / 15 RPM',
  },
  sambanova: {
    provider: 'sambanova',
    name: 'SambaNova SN40L',
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 500000,
    rateLimitPerMin: 20,
    tokensPerMin: 100000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1 000 ta so\'rov (DeepSeek R1)',
  },
  cerebras: {
    provider: 'cerebras',
    name: 'Cerebras Wafer-Scale',
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 1000000,
    rateLimitPerMin: 30,
    tokensPerMin: 60000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1 000 ta so\'rov (1000 tok/s)',
  },
  openrouter: {
    provider: 'openrouter',
    name: 'OpenRouter Mesh',
    dailyRequestsLimit: 200,
    dailyTokensLimit: 200000,
    rateLimitPerMin: 20,
    tokensPerMin: 50000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 200 ta bepul so\'rov',
  },
  mistral: {
    provider: 'mistral',
    name: 'Mistral AI',
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 500000,
    rateLimitPerMin: 10,
    tokensPerMin: 50000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1 000 ta bepul so\'rov',
  },
  cloudflare: {
    provider: 'cloudflare',
    name: 'Cloudflare Workers AI',
    dailyRequestsLimit: 10000,
    dailyTokensLimit: 100000,
    rateLimitPerMin: 50,
    tokensPerMin: 50000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 10 000 ta bepul neyron amaliyot',
  },
  huggingface: {
    provider: 'huggingface',
    name: 'HuggingFace Hub',
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 200000,
    rateLimitPerMin: 10,
    tokensPerMin: 30000,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Serverless Inference API',
  },
};

export interface CalculatedKeyQuota {
  keyId: string;
  provider: string;
  providerName: string;
  maskedKey: string;
  status: string;
  usedRequests: number;
  usedTokens: number;
  dailyRequestsLimit: number;
  remainingRequests: number;
  dailyTokensLimit: number;
  remainingTokens: number;
  percentRemaining: number;
  healthStatus: 'healthy' | 'warning' | 'exhausted' | 'error';
  resetInfo: string;
  isRealData: boolean;
  rateLimitType?: string;
  latencyMs?: number;
  lastChecked?: number;
  assignedHosting?: string;
  assignedHostingUrl?: string;
}

export function calculateKeyQuota(
  provider: string,
  keyId: string,
  maskedKey: string,
  status: string,
  usedRequests: number,
  usedTokens: number,
  realQuota?: RealQuotaData,
  assignedHosting?: string,
  assignedHostingUrl?: string
): CalculatedKeyQuota {
  const provKey = provider.toLowerCase();
  const info = PROVIDER_FREE_QUOTAS[provKey] || {
    provider: provKey as ProviderId,
    name: provider.toUpperCase(),
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 500000,
    rateLimitPerMin: 20,
    tokensPerMin: 50000,
    resetInterval: 'Har 24 soatda',
    notes: 'Standart bepul rejim',
  };

  // Determine Real or Estimated values
  const hasRealRemaining = realQuota && realQuota.remainingRequests !== undefined;
  const hasRealTokens = realQuota && realQuota.remainingTokens !== undefined;

  const dailyRequestsLimit = (realQuota && realQuota.limitRequests) || info.dailyRequestsLimit;
  const dailyTokensLimit = (realQuota && realQuota.limitTokens) || info.dailyTokensLimit;

  let remainingRequests = hasRealRemaining 
    ? (realQuota!.remainingRequests as number)
    : Math.max(0, dailyRequestsLimit - usedRequests);

  let remainingTokens = hasRealTokens
    ? (realQuota!.remainingTokens as number)
    : Math.max(0, dailyTokensLimit - usedTokens);

  if (realQuota?.isRateLimited) {
    remainingRequests = 0;
  }

  const percentRemaining = dailyRequestsLimit > 0 
    ? Math.max(0, Math.min(100, Math.round((remainingRequests / dailyRequestsLimit) * 100)))
    : 100;

  let healthStatus: CalculatedKeyQuota['healthStatus'] = 'healthy';
  if (status === 'error') {
    healthStatus = 'error';
  } else if (realQuota?.isRateLimited || remainingRequests <= 0) {
    healthStatus = 'exhausted';
  } else if (percentRemaining < 20 || status === 'cooling_down') {
    healthStatus = 'warning';
  }

  let resetInfo = info.resetInterval;
  if (realQuota?.resetRequests) {
    resetInfo = `Tiklanadi: ${realQuota.resetRequests}`;
  } else if (realQuota?.isRateLimited) {
    if (realQuota.rateLimitType === 'minute_tpm') resetInfo = 'Minutlik Token (TPM) limitida (~1 daqiqa)';
    else if (realQuota.rateLimitType === 'minute_rpm') resetInfo = 'Minutlik So\'rov (RPM) limitida (~1 daqiqa)';
    else resetInfo = 'Kunlik limit tugagan (24s da tiklanadi)';
  }

  return {
    keyId,
    provider: provKey,
    providerName: info.name,
    maskedKey,
    status,
    usedRequests,
    usedTokens,
    dailyRequestsLimit,
    remainingRequests,
    dailyTokensLimit,
    remainingTokens,
    percentRemaining,
    healthStatus,
    resetInfo,
    isRealData: Boolean(hasRealRemaining || realQuota?.lastChecked),
    rateLimitType: realQuota?.rateLimitType,
    latencyMs: realQuota?.latencyMs,
    lastChecked: realQuota?.lastChecked,
    assignedHosting: assignedHosting || (provKey === 'cloudflare' ? '☁️ Cloudflare Global Edge' : '⚡️ Vercel Edge US-East / Deno (Auto)'),
    assignedHostingUrl: assignedHostingUrl,
  };
}
