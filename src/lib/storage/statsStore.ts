import fs from 'fs';
import path from 'path';
import { ProviderId } from '../core/types';

export interface ProviderStatItem {
  provider: string;
  name: string;
  requestsCount: number;
  successCount: number;
  failCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  lastUsedAt?: number;
}

export interface NodeStatItem {
  id: string;
  name: string;
  type: string;
  url: string;
  requestsCount: number;
  successCount: number;
  failCount: number;
  latencyMs?: number;
  lastUsedAt?: number;
  status: 'online' | 'degraded' | 'offline';
}

export interface ModelStatItem {
  model: string;
  requestsCount: number;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  lastUsedAt?: number;
}

export interface RequestLogEntry {
  id: string;
  timestamp: number;
  provider: string;
  node?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  latencyMs?: number;
  status: 'success' | 'error';
  errorMessage?: string;
}

export interface ClusterStatsData {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  providers: Record<string, ProviderStatItem>;
  nodes: Record<string, NodeStatItem>;
  models: Record<string, ModelStatItem>;
  recentLogs: RequestLogEntry[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const STATS_FILE = path.join(DATA_DIR, 'stats.json');

const DEFAULT_PROVIDERS: Record<string, string> = {
  groq: 'Groq Cloud LPU',
  gemini: 'Google AI Studio (Gemini)',
  sambanova: 'SambaNova SN40L',
  cerebras: 'Cerebras Wafer-Scale',
  openrouter: 'OpenRouter Mesh',
  mistral: 'Mistral AI',
  cloudflare: 'Cloudflare Workers AI',
  huggingface: 'HuggingFace Hub',
};

function getInitialStats(): ClusterStatsData {
  const providers: Record<string, ProviderStatItem> = {};
  for (const [id, name] of Object.entries(DEFAULT_PROVIDERS)) {
    providers[id] = {
      provider: id,
      name,
      requestsCount: 0,
      successCount: 0,
      failCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }

  return {
    totalRequests: 0,
    totalPromptTokens: 0,
    totalCompletionTokens: 0,
    totalTokens: 0,
    providers,
    nodes: {},
    models: {},
    recentLogs: [],
  };
}

let inMemoryStats: ClusterStatsData | null = null;

export function loadClusterStats(): ClusterStatsData {
  if (inMemoryStats) return inMemoryStats;

  const initial = getInitialStats();

  try {
    if (fs.existsSync(STATS_FILE)) {
      const raw = fs.readFileSync(STATS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      // Merge with default providers
      const mergedProviders = { ...initial.providers, ...(parsed.providers || {}) };

      inMemoryStats = {
        totalRequests: parsed.totalRequests || 0,
        totalPromptTokens: parsed.totalPromptTokens || 0,
        totalCompletionTokens: parsed.totalCompletionTokens || 0,
        totalTokens: parsed.totalTokens || 0,
        providers: mergedProviders,
        nodes: parsed.nodes || {},
        models: parsed.models || {},
        recentLogs: Array.isArray(parsed.recentLogs) ? parsed.recentLogs.slice(0, 100) : [],
      };
      return inMemoryStats;
    }
  } catch (err) {
    console.warn('[StatsStore] Error reading stats file:', err);
  }

  inMemoryStats = initial;
  saveClusterStats(inMemoryStats);
  return inMemoryStats;
}

export function saveClusterStats(data: ClusterStatsData): void {
  inMemoryStats = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(STATS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Ignore error
  }
}

/**
 * Record a completed AI Request with token counts and node latency
 */
export function recordRequestStats(params: {
  provider: string;
  nodeName?: string;
  nodeUrl?: string;
  nodeType?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  latencyMs?: number;
  status: 'success' | 'error';
  errorMessage?: string;
}): void {
  const stats = loadClusterStats();
  const totalToks = params.promptTokens + params.completionTokens;
  const now = Date.now();

  // 1. Global totals
  stats.totalRequests += 1;
  stats.totalPromptTokens += params.promptTokens;
  stats.totalCompletionTokens += params.completionTokens;
  stats.totalTokens += totalToks;

  // 2. Provider stats
  const provKey = params.provider.toLowerCase();
  if (!stats.providers[provKey]) {
    stats.providers[provKey] = {
      provider: provKey,
      name: DEFAULT_PROVIDERS[provKey] || provKey.toUpperCase(),
      requestsCount: 0,
      successCount: 0,
      failCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }
  const pStat = stats.providers[provKey];
  pStat.requestsCount += 1;
  if (params.status === 'success') {
    pStat.successCount += 1;
  } else {
    pStat.failCount += 1;
  }
  pStat.promptTokens += params.promptTokens;
  pStat.completionTokens += params.completionTokens;
  pStat.totalTokens += totalToks;
  pStat.lastUsedAt = now;

  // 3. Node stats (if routed through an edge node)
  if (params.nodeName || params.nodeUrl) {
    const nodeKey = params.nodeName || params.nodeUrl || 'Direct';
    if (!stats.nodes[nodeKey]) {
      stats.nodes[nodeKey] = {
        id: `node-stat-${nodeKey}`,
        name: params.nodeName || nodeKey,
        type: params.nodeType || 'edge',
        url: params.nodeUrl || '',
        requestsCount: 0,
        successCount: 0,
        failCount: 0,
        status: 'online',
      };
    }
    const nStat = stats.nodes[nodeKey];
    nStat.requestsCount += 1;
    if (params.status === 'success') {
      nStat.successCount += 1;
      nStat.status = 'online';
    } else {
      nStat.failCount += 1;
    }
    if (params.latencyMs !== undefined) nStat.latencyMs = params.latencyMs;
    nStat.lastUsedAt = now;
  }

  // 4. Model stats
  const modelKey = params.model || 'iportal-ai';
  if (!stats.models[modelKey]) {
    stats.models[modelKey] = {
      model: modelKey,
      requestsCount: 0,
      promptTokens: 0,
      completionTokens: 0,
      totalTokens: 0,
    };
  }
  const mStat = stats.models[modelKey];
  mStat.requestsCount += 1;
  mStat.promptTokens += params.promptTokens;
  mStat.completionTokens += params.completionTokens;
  mStat.totalTokens += totalToks;
  mStat.lastUsedAt = now;

  // 5. Recent Request Logs (Keep last 50 entries)
  const logEntry: RequestLogEntry = {
    id: `req-${now}-${Math.random().toString(36).substring(2, 6)}`,
    timestamp: now,
    provider: params.provider,
    node: params.nodeName || 'Direct VDS',
    model: params.model,
    promptTokens: params.promptTokens,
    completionTokens: params.completionTokens,
    totalTokens: totalToks,
    latencyMs: params.latencyMs,
    status: params.status,
    errorMessage: params.errorMessage,
  };

  stats.recentLogs.unshift(logEntry);
  if (stats.recentLogs.length > 50) {
    stats.recentLogs = stats.recentLogs.slice(0, 50);
  }

  saveClusterStats(stats);
}
