import { ProviderId } from './types';

export interface ProviderQuotaInfo {
  provider: ProviderId;
  name: string;
  dailyRequestsLimit: number;
  dailyTokensLimit: number;
  rateLimitPerMin: number;
  resetInterval: string;
  notes: string;
}

export const PROVIDER_FREE_QUOTAS: Record<string, ProviderQuotaInfo> = {
  groq: {
    provider: 'groq',
    name: 'Groq Cloud LPU',
    dailyRequestsLimit: 14400,
    dailyTokensLimit: 1000000,
    rateLimitPerMin: 30,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 14,400 ta so\'rov / 1M token bepul',
  },
  gemini: {
    provider: 'gemini',
    name: 'Google AI Studio (Gemini)',
    dailyRequestsLimit: 1500,
    dailyTokensLimit: 1000000,
    rateLimitPerMin: 15,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1,500 ta so\'rov bepul',
  },
  sambanova: {
    provider: 'sambanova',
    name: 'SambaNova SN40L',
    dailyRequestsLimit: 10000,
    dailyTokensLimit: 500000,
    rateLimitPerMin: 20,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 10,000 ta so\'rov bepul (DeepSeek R1)',
  },
  cerebras: {
    provider: 'cerebras',
    name: 'Cerebras Wafer-Scale',
    dailyRequestsLimit: 14400,
    dailyTokensLimit: 1000000,
    rateLimitPerMin: 30,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 14,400 ta so\'rov (1000 tok/s)',
  },
  openrouter: {
    provider: 'openrouter',
    name: 'OpenRouter Mesh',
    dailyRequestsLimit: 200,
    dailyTokensLimit: 200000,
    rateLimitPerMin: 20,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Bepul modellar uchun kunlik 200 ta so\'rov',
  },
  mistral: {
    provider: 'mistral',
    name: 'Mistral AI',
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 500000,
    rateLimitPerMin: 10,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 1,000 ta bepul so\'rov',
  },
  cloudflare: {
    provider: 'cloudflare',
    name: 'Cloudflare Workers AI',
    dailyRequestsLimit: 10000,
    dailyTokensLimit: 100000,
    rateLimitPerMin: 50,
    resetInterval: 'Har 24 soatda (00:00 UTC)',
    notes: 'Kunlik 10,000 ta bepul neyron amaliyot',
  },
  huggingface: {
    provider: 'huggingface',
    name: 'HuggingFace Hub',
    dailyRequestsLimit: 1000,
    dailyTokensLimit: 200000,
    rateLimitPerMin: 10,
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
}

export function calculateKeyQuota(
  provider: string,
  keyId: string,
  maskedKey: string,
  status: string,
  usedRequests: number,
  usedTokens: number
): CalculatedKeyQuota {
  const provKey = provider.toLowerCase();
  const info = PROVIDER_FREE_QUOTAS[provKey] || {
    provider: provKey as ProviderId,
    name: provider.toUpperCase(),
    dailyRequestsLimit: 5000,
    dailyTokensLimit: 500000,
    rateLimitPerMin: 20,
    resetInterval: 'Har 24 soatda',
    notes: 'Standart bepul rejim',
  };

  const remainingRequests = Math.max(0, info.dailyRequestsLimit - usedRequests);
  const remainingTokens = Math.max(0, info.dailyTokensLimit - usedTokens);
  const percentRemaining = Math.max(0, Math.min(100, Math.round((remainingRequests / info.dailyRequestsLimit) * 100)));

  let healthStatus: CalculatedKeyQuota['healthStatus'] = 'healthy';
  if (status === 'error' || status === 'cooling_down') {
    healthStatus = 'error';
  } else if (percentRemaining <= 5) {
    healthStatus = 'exhausted';
  } else if (percentRemaining <= 20) {
    healthStatus = 'warning';
  }

  return {
    keyId,
    provider: provKey,
    providerName: info.name,
    maskedKey,
    status,
    usedRequests,
    usedTokens,
    dailyRequestsLimit: info.dailyRequestsLimit,
    remainingRequests,
    dailyTokensLimit: info.dailyTokensLimit,
    remainingTokens,
    percentRemaining,
    healthStatus,
    resetInfo: info.resetInterval,
  };
}
