import { ProviderId, ProviderKeyItem, WorkerNode } from './types';
import { loadStore, saveStore } from '../storage/dataStore';

// In-memory runtime tracking for keys and nodes
interface KeyStats {
  failureCount: number;
  cooldownUntil: number;
  lastUsedAt: number;
}

interface NodeStats {
  failureCount: number;
  cooldownUntil: number;
  lastLatencyMs: number;
}

const keyRuntimeMap = new Map<string, KeyStats>();
const nodeRuntimeMap = new Map<string, NodeStats>();

const COOLDOWN_429_MS = 60 * 1000; // 60 seconds cooldown on Rate Limit (429)
const COOLDOWN_ERROR_MS = 30 * 1000; // 30 seconds cooldown on 5xx or connection error
const MAX_FAILURES_BEFORE_COOLDOWN = 2;

export class CircuitBreaker {
  /**
   * Mark a key as successfully used
   */
  static recordKeySuccess(keyItem: ProviderKeyItem): void {
    const stats = keyRuntimeMap.get(keyItem.id) || {
      failureCount: 0,
      cooldownUntil: 0,
      lastUsedAt: 0,
    };
    stats.failureCount = 0;
    stats.cooldownUntil = 0;
    stats.lastUsedAt = Date.now();
    keyRuntimeMap.set(keyItem.id, stats);

    // Update persistent store
    const store = loadStore();
    const target = store.providerKeys.find(k => k.id === keyItem.id);
    if (target) {
      target.status = 'active';
      target.successCount += 1;
      target.lastUsedAt = Date.now();
      saveStore(store);
    }
  }

  /**
   * Mark a key as failed (429 or 5xx)
   */
  static recordKeyFailure(keyItem: ProviderKeyItem, statusCode: number, errorMsg?: string): void {
    const stats = keyRuntimeMap.get(keyItem.id) || {
      failureCount: 0,
      cooldownUntil: 0,
      lastUsedAt: 0,
    };
    stats.failureCount += 1;
    stats.lastUsedAt = Date.now();

    const cooldownDuration = statusCode === 429 ? COOLDOWN_429_MS : COOLDOWN_ERROR_MS;
    stats.cooldownUntil = Date.now() + cooldownDuration;
    keyRuntimeMap.set(keyItem.id, stats);

    console.warn(`[CircuitBreaker] Key ${keyItem.id} (${keyItem.provider}) entered cooldown for ${cooldownDuration / 1000}s due to status ${statusCode}: ${errorMsg || ''}`);

    // Update persistent store
    const store = loadStore();
    const target = store.providerKeys.find(k => k.id === keyItem.id);
    if (target) {
      target.status = 'cooling_down';
      target.cooldownUntil = stats.cooldownUntil;
      target.failCount += 1;
      target.errorReason = `HTTP ${statusCode}: ${errorMsg || 'Error'}`;
      saveStore(store);
    }
  }

  /**
   * Check if key is currently available
   */
  static isKeyAvailable(keyItem: ProviderKeyItem): boolean {
    const stats = keyRuntimeMap.get(keyItem.id);
    if (!stats) return true;
    if (stats.cooldownUntil && Date.now() < stats.cooldownUntil) {
      return false;
    }
    return true;
  }

  /**
   * Mark a worker node as success
   */
  static recordNodeSuccess(node: WorkerNode, latencyMs: number): void {
    const stats = nodeRuntimeMap.get(node.id) || {
      failureCount: 0,
      cooldownUntil: 0,
      lastLatencyMs: 0,
    };
    stats.failureCount = 0;
    stats.cooldownUntil = 0;
    stats.lastLatencyMs = latencyMs;
    nodeRuntimeMap.set(node.id, stats);

    const store = loadStore();
    const target = store.workerNodes.find(n => n.id === node.id);
    if (target) {
      target.status = 'online';
      target.latencyMs = latencyMs;
      target.failureCount = 0;
      target.lastChecked = Date.now();
      saveStore(store);
    }
  }

  /**
   * Mark a worker node as failed
   */
  static recordNodeFailure(node: WorkerNode, errorMsg?: string): void {
    const stats = nodeRuntimeMap.get(node.id) || {
      failureCount: 0,
      cooldownUntil: 0,
      lastLatencyMs: 0,
    };
    stats.failureCount += 1;
    
    if (stats.failureCount >= MAX_FAILURES_BEFORE_COOLDOWN) {
      stats.cooldownUntil = Date.now() + COOLDOWN_ERROR_MS;
      console.warn(`[CircuitBreaker] Worker Node ${node.name} (${node.url}) marked OFFLINE for 30s: ${errorMsg}`);
    }

    nodeRuntimeMap.set(node.id, stats);

    const store = loadStore();
    const target = store.workerNodes.find(n => n.id === node.id);
    if (target) {
      target.status = stats.failureCount >= MAX_FAILURES_BEFORE_COOLDOWN ? 'offline' : 'degraded';
      target.failureCount = stats.failureCount;
      target.lastChecked = Date.now();
      saveStore(store);
    }
  }

  /**
   * Check if worker node is currently available
   */
  static isNodeAvailable(node: WorkerNode): boolean {
    const stats = nodeRuntimeMap.get(node.id);
    if (!stats) return true;
    if (stats.cooldownUntil && Date.now() < stats.cooldownUntil) {
      return false;
    }
    return true;
  }
}
