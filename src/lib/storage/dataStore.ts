import fs from 'fs';
import path from 'path';
import { ApiKeyItem, ProviderId, ProviderKeyItem, WorkerNode } from '../core/types';

interface StoreData {
  apiKeys: ApiKeyItem[];
  providerKeys: ProviderKeyItem[];
  workerNodes: WorkerNode[];
  masterKey: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'store.json');

// In-memory cache
let inMemoryStore: StoreData | null = null;

function getInitialData(): StoreData {
  const masterKey = process.env.IPORTAL_MASTER_KEY || 'ip-master-secret-key-change-me';

  const defaultApiKeys: ApiKeyItem[] = [
    {
      id: 'default-master-key',
      key: masterKey,
      name: 'Master Admin Key',
      createdAt: Date.now(),
      requestsCount: 0,
      status: 'active',
    },
    {
      id: 'demo-public-key',
      key: 'ip-live-iportal-ai-public-free',
      name: 'Public Free Client Key',
      createdAt: Date.now(),
      requestsCount: 0,
      status: 'active',
      rateLimitPerMin: 60,
    }
  ];

  // Parse Provider Keys from ENV (Supports comma-separated keys: GROQ_API_KEYS=key1,key2,key3)
  const providerKeys: ProviderKeyItem[] = [];

  const addKeysFromEnv = (provider: ProviderId, envVar: string) => {
    const raw = process.env[envVar] || '';
    const keys = raw.split(',').map(k => k.trim()).filter(Boolean);
    keys.forEach((k, idx) => {
      providerKeys.push({
        id: `${provider}-env-${idx + 1}`,
        provider,
        key: k,
        maskedKey: maskKey(k),
        status: 'active',
        successCount: 0,
        failCount: 0,
      });
    });
  };

  addKeysFromEnv('groq', 'GROQ_API_KEYS');
  addKeysFromEnv('groq', 'GROQ_API_KEY');
  addKeysFromEnv('gemini', 'GEMINI_API_KEYS');
  addKeysFromEnv('gemini', 'GEMINI_API_KEY');
  addKeysFromEnv('sambanova', 'SAMBANOVA_API_KEYS');
  addKeysFromEnv('sambanova', 'SAMBANOVA_API_KEY');
  addKeysFromEnv('cerebras', 'CEREBRAS_API_KEYS');
  addKeysFromEnv('cerebras', 'CEREBRAS_API_KEY');
  addKeysFromEnv('openrouter', 'OPENROUTER_API_KEYS');
  addKeysFromEnv('openrouter', 'OPENROUTER_API_KEY');
  addKeysFromEnv('mistral', 'MISTRAL_API_KEYS');
  addKeysFromEnv('mistral', 'MISTRAL_API_KEY');
  addKeysFromEnv('cloudflare', 'CLOUDFLARE_AI_KEYS');
  addKeysFromEnv('cloudflare', 'CLOUDFLARE_API_KEY');
  addKeysFromEnv('cloudflare', 'CLOUDFLARE_API_TOKEN');
  addKeysFromEnv('huggingface', 'HUGGINGFACE_API_KEYS');
  addKeysFromEnv('huggingface', 'HUGGINGFACE_API_KEY');

  // Parse Worker Nodes from ENV (e.g. WORKER_URLS=https://node1.workers.dev,https://node2.deno.dev)
  const workerNodes: WorkerNode[] = [];
  const vercelProxy = process.env.VERCEL_PROXY_URL || 'https://vercel-vert-sigma-25.vercel.app/api/proxy';
  if (vercelProxy) {
    workerNodes.push({
      id: 'node-vercel-edge-1',
      name: 'Vercel Edge US-East (iad1)',
      type: 'vercel',
      url: vercelProxy.trim(),
      secret: process.env.PROXY_SECRET || 'iportal-proxy-secret-token',
      status: 'online',
      failureCount: 0,
    });
  }

  const rawWorkers = process.env.WORKER_URLS || '';
  const urls = rawWorkers.split(',').map(u => u.trim()).filter(Boolean);
  urls.forEach((u, idx) => {
    if (workerNodes.some(n => n.url === u)) return;
    let type: WorkerNode['type'] = 'custom';
    if (u.includes('workers.dev')) type = 'cloudflare';
    else if (u.includes('deno.dev')) type = 'deno';
    else if (u.includes('vercel.app')) type = 'vercel';
    else if (u.includes('netlify.app')) type = 'netlify';
    else if (u.includes('onrender.com')) type = 'render';
    else if (u.includes('koyeb.app')) type = 'koyeb';

    workerNodes.push({
      id: `worker-env-${idx + 1}`,
      name: `Edge Node ${idx + 1} (${type})`,
      type,
      url: u,
      secret: process.env.PROXY_SECRET || 'iportal-proxy-secret-token',
      status: 'online',
      failureCount: 0,
    });
  });

  return {
    apiKeys: defaultApiKeys,
    providerKeys,
    workerNodes,
    masterKey,
  };
}

export function maskKey(key: string): string {
  if (!key || key.length < 8) return '••••••••';
  return `${key.slice(0, 4)}••••${key.slice(-4)}`;
}

export function loadStore(): StoreData {
  if (inMemoryStore) return inMemoryStore;

  const initial = getInitialData();

  try {
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed = JSON.parse(raw);

      // Merge saved keys with initial env keys (no duplicate keys)
      const mergedProviderKeys = [...initial.providerKeys];
      if (Array.isArray(parsed.providerKeys)) {
        for (const pk of parsed.providerKeys) {
          if (!mergedProviderKeys.some(existing => existing.key === pk.key)) {
            mergedProviderKeys.push(pk);
          }
        }
      }

      const mergedWorkerNodes = [...initial.workerNodes];
      if (Array.isArray(parsed.workerNodes)) {
        for (const wn of parsed.workerNodes) {
          if (!mergedWorkerNodes.some(existing => existing.url === wn.url)) {
            mergedWorkerNodes.push(wn);
          }
        }
      }

      const mergedApiKeys = Array.isArray(parsed.apiKeys) && parsed.apiKeys.length > 0 
        ? parsed.apiKeys 
        : initial.apiKeys;

      inMemoryStore = {
        apiKeys: mergedApiKeys,
        providerKeys: mergedProviderKeys,
        workerNodes: mergedWorkerNodes,
        masterKey: parsed.masterKey || initial.masterKey,
      };
      return inMemoryStore;
    }
  } catch (err) {
    console.warn('[DataStore] Failed to read store file, falling back to memory/env:', err);
  }

  inMemoryStore = initial;
  saveStore(inMemoryStore);
  return inMemoryStore;
}

export function saveStore(data: StoreData): void {
  inMemoryStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // Graceful on serverless environments where local disk write is not allowed
    // console.warn('[DataStore] Local disk write not allowed, kept in memory store.');
  }
}

// Helpers for API keys
export function getAllApiKeys(): ApiKeyItem[] {
  return loadStore().apiKeys;
}

export function createApiKey(name: string, customKey?: string, rateLimitPerMin?: number): ApiKeyItem {
  const store = loadStore();
  const randomSuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const key = customKey || `ip-live-${randomSuffix}`;

  const newItem: ApiKeyItem = {
    id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    key,
    name: name || 'API Key',
    createdAt: Date.now(),
    requestsCount: 0,
    status: 'active',
    rateLimitPerMin: rateLimitPerMin || 120,
  };

  store.apiKeys.push(newItem);
  saveStore(store);
  return newItem;
}

export function revokeApiKey(id: string): boolean {
  const store = loadStore();
  const item = store.apiKeys.find(k => k.id === id);
  if (item) {
    item.status = 'revoked';
    saveStore(store);
    return true;
  }
  return false;
}

export function deleteApiKey(id: string): boolean {
  const store = loadStore();
  const idx = store.apiKeys.findIndex(k => k.id === id);
  if (idx !== -1) {
    store.apiKeys.splice(idx, 1);
    saveStore(store);
    return true;
  }
  return false;
}

export function validateApiKey(key: string): { valid: boolean; keyItem?: ApiKeyItem } {
  if (!key) return { valid: false };
  const store = loadStore();
  
  // Master key check
  if (key === store.masterKey || key === process.env.IPORTAL_MASTER_KEY) {
    return {
      valid: true,
      keyItem: {
        id: 'master',
        key: store.masterKey,
        name: 'Master Key',
        createdAt: Date.now(),
        requestsCount: 0,
        status: 'active',
      }
    };
  }

  const found = store.apiKeys.find(k => k.key === key && k.status === 'active');
  if (found) {
    found.requestsCount += 1;
    found.lastUsedAt = Date.now();
    saveStore(store);
    return { valid: true, keyItem: found };
  }

  return { valid: false };
}

// Helpers for Provider keys
export function getProviderKeys(provider?: ProviderId): ProviderKeyItem[] {
  const store = loadStore();
  if (provider) {
    return store.providerKeys.filter(k => k.provider === provider);
  }
  return store.providerKeys;
}

export function addProviderKey(provider: ProviderId, key: string): ProviderKeyItem {
  const store = loadStore();
  const cleanKey = key.trim();
  const existing = store.providerKeys.find(k => k.key === cleanKey);
  if (existing) return existing;

  const newItem: ProviderKeyItem = {
    id: `${provider}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    provider,
    key: cleanKey,
    maskedKey: maskKey(cleanKey),
    status: 'active',
    successCount: 0,
    failCount: 0,
  };

  store.providerKeys.push(newItem);
  saveStore(store);
  return newItem;
}

export function removeProviderKey(id: string): boolean {
  const store = loadStore();
  const idx = store.providerKeys.findIndex(k => k.id === id);
  if (idx !== -1) {
    store.providerKeys.splice(idx, 1);
    saveStore(store);
    return true;
  }
  return false;
}

export function detectProviderFromKey(key: string, fallback: ProviderId = 'groq'): ProviderId {
  const k = key.trim();
  if (k.startsWith('gsk_')) return 'groq';
  if (k.startsWith('AIzaSy')) return 'gemini';
  if (k.startsWith('csk-')) return 'cerebras';
  if (k.startsWith('sk-or-')) return 'openrouter';
  if (k.startsWith('hf_')) return 'huggingface';
  if (k.startsWith('sn_') || k.length === 64) return 'sambanova';
  return fallback;
}

export function addBulkProviderKeys(keysList: Array<{ key: string; provider?: ProviderId }>, defaultProvider: ProviderId = 'groq'): {
  added: ProviderKeyItem[];
  totalAdded: number;
  totalSkipped: number;
} {
  const store = loadStore();
  const added: ProviderKeyItem[] = [];
  let skipped = 0;

  for (const item of keysList) {
    const cleanKey = item.key.trim();
    if (!cleanKey) continue;

    const existing = store.providerKeys.find(k => k.key === cleanKey);
    if (existing) {
      skipped++;
      continue;
    }

    const provider = item.provider || detectProviderFromKey(cleanKey, defaultProvider);
    const newItem: ProviderKeyItem = {
      id: `${provider}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      provider,
      key: cleanKey,
      maskedKey: maskKey(cleanKey),
      status: 'active',
      successCount: 0,
      failCount: 0,
    };

    store.providerKeys.push(newItem);
    added.push(newItem);
  }

  if (added.length > 0) {
    saveStore(store);
  }

  return { added, totalAdded: added.length, totalSkipped: skipped };
}

// Helpers for Worker Nodes
export function getWorkerNodes(): WorkerNode[] {
  return loadStore().workerNodes;
}

export function addWorkerNode(name: string, url: string, type?: WorkerNode['type'], secret?: string): WorkerNode {
  const store = loadStore();
  const cleanUrl = url.trim().replace(/\/+$/, '');
  
  let detectedType: WorkerNode['type'] = type || 'custom';
  if (cleanUrl.includes('workers.dev')) detectedType = 'cloudflare';
  else if (cleanUrl.includes('deno.dev')) detectedType = 'deno';
  else if (cleanUrl.includes('vercel.app')) detectedType = 'vercel';
  else if (cleanUrl.includes('netlify.app')) detectedType = 'netlify';
  else if (cleanUrl.includes('onrender.com')) detectedType = 'render';
  else if (cleanUrl.includes('koyeb.app')) detectedType = 'koyeb';
  else if (cleanUrl.includes('railway.app')) detectedType = 'railway';

  const newItem: WorkerNode = {
    id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    name: name || `Node (${detectedType})`,
    type: detectedType,
    url: cleanUrl,
    secret: secret || process.env.PROXY_SECRET || 'iportal-proxy-secret-token',
    status: 'online',
    failureCount: 0,
  };

  store.workerNodes.push(newItem);
  saveStore(store);
  return newItem;
}

export function addBulkWorkerNodes(nodesList: Array<{ url: string; name?: string; type?: WorkerNode['type']; secret?: string }>): {
  added: WorkerNode[];
  totalAdded: number;
  totalSkipped: number;
} {
  const store = loadStore();
  const added: WorkerNode[] = [];
  let skipped = 0;

  for (const item of nodesList) {
    const cleanUrl = item.url.trim().replace(/\/+$/, '');
    if (!cleanUrl) continue;

    const existing = store.workerNodes.find(n => n.url === cleanUrl);
    if (existing) {
      skipped++;
      continue;
    }

    let detectedType: WorkerNode['type'] = item.type || 'custom';
    if (cleanUrl.includes('workers.dev')) detectedType = 'cloudflare';
    else if (cleanUrl.includes('deno.dev')) detectedType = 'deno';
    else if (cleanUrl.includes('vercel.app')) detectedType = 'vercel';
    else if (cleanUrl.includes('netlify.app')) detectedType = 'netlify';
    else if (cleanUrl.includes('onrender.com')) detectedType = 'render';
    else if (cleanUrl.includes('koyeb.app')) detectedType = 'koyeb';
    else if (cleanUrl.includes('railway.app')) detectedType = 'railway';

    const newItem: WorkerNode = {
      id: `node-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: item.name || `Node (${detectedType})`,
      type: detectedType,
      url: cleanUrl,
      secret: item.secret || process.env.PROXY_SECRET || 'iportal-proxy-secret-token',
      status: 'online',
      failureCount: 0,
    };

    store.workerNodes.push(newItem);
    added.push(newItem);
  }

  if (added.length > 0) {
    saveStore(store);
  }

  return { added, totalAdded: added.length, totalSkipped: skipped };
}

export function removeWorkerNode(id: string): boolean {
  const store = loadStore();
  const idx = store.workerNodes.findIndex(n => n.id === id);
  if (idx !== -1) {
    store.workerNodes.splice(idx, 1);
    saveStore(store);
    return true;
  }
  return false;
}

export function updateWorkerNodeStatus(id: string, status: WorkerNode['status'], latencyMs?: number): void {
  const store = loadStore();
  const node = store.workerNodes.find(n => n.id === id);
  if (node) {
    node.status = status;
    if (latencyMs !== undefined) node.latencyMs = latencyMs;
    node.lastChecked = Date.now();
    saveStore(store);
  }
}
