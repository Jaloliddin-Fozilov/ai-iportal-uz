import { ProviderId, ProviderKeyItem, WorkerNode } from './types';
import { loadStore } from '../storage/dataStore';
import { CircuitBreaker } from './circuitBreaker';

let nodeIndex = 0;
const providerKeyIndices = new Map<string, number>();

export class LoadBalancer {
  /**
   * Select the best available API key for a provider
   */
  static selectKey(provider: ProviderId): ProviderKeyItem | null {
    const store = loadStore();
    const allKeys = store.providerKeys.filter(k => k.provider === provider);

    if (allKeys.length === 0) return null;

    // Filter available keys (not in cooldown)
    const availableKeys = allKeys.filter(k => CircuitBreaker.isKeyAvailable(k));

    if (availableKeys.length === 0) {
      // If all are in cooldown, pick the one with earliest cooldown expiry
      console.warn(`[LoadBalancer] All keys for ${provider} are in cooldown! Picking fallback key.`);
      return allKeys[0];
    }

    // Round-robin selection among available keys
    let idx = providerKeyIndices.get(provider) || 0;
    const selected = availableKeys[idx % availableKeys.length];
    providerKeyIndices.set(provider, (idx + 1) % availableKeys.length);

    return selected;
  }

  /**
   * Select the best worker node (Weighted by lowest latency + round-robin for distribution)
   */
  static selectNode(): WorkerNode | null {
    const store = loadStore();
    const allNodes = store.workerNodes;

    if (allNodes.length === 0) return null;

    const availableNodes = allNodes.filter(n => CircuitBreaker.isNodeAvailable(n) && n.status !== 'offline');
    if (availableNodes.length === 0) {
      return null; // Fallback to direct fetch
    }

    // 1. Sort by latency (if measured), prioritizing fast online nodes (< 300ms)
    const sorted = [...availableNodes].sort((a, b) => {
      const latA = a.latencyMs ?? 999;
      const latB = b.latencyMs ?? 999;
      return latA - latB;
    });

    // 2. Pick among top fast nodes using round-robin to evenly distribute IP queries
    const candidatePool = sorted.slice(0, Math.max(1, Math.ceil(sorted.length / 2)));
    const node = candidatePool[nodeIndex % candidatePool.length];
    nodeIndex = (nodeIndex + 1) % candidatePool.length;

    return node;
  }

  /**
   * Select a dedicated worker node for a specific key (Distributes keys across distinct hosting nodes)
   */
  static selectNodeForKey(keyItem?: ProviderKeyItem | null): WorkerNode | null {
    const store = loadStore();
    const allNodes = store.workerNodes.filter(n => CircuitBreaker.isNodeAvailable(n) && n.status !== 'offline');
    if (allNodes.length === 0) return null;

    if (keyItem?.assignedNodeId) {
      const found = allNodes.find(n => n.id === keyItem.assignedNodeId);
      if (found) return found;
    }

    if (keyItem) {
      const allKeysForProvider = store.providerKeys.filter(k => k.provider === keyItem.provider);
      const keyIdx = allKeysForProvider.findIndex(k => k.id === keyItem.id);
      if (keyIdx >= 0) {
        return allNodes[keyIdx % allNodes.length];
      }
    }

    return this.selectNode();
  }

  /**
   * Ultra-fast Edge Fetch with Connection Keep-Alive and Fast Timeout Fallback
   */
  static async executeFetch(
    targetUrl: string,
    options: RequestInit,
    preferNode?: WorkerNode | null,
    keyItem?: ProviderKeyItem | null
  ): Promise<{ response: Response; usedNode: WorkerNode | null }> {
    const node = preferNode !== undefined ? preferNode : this.selectNodeForKey(keyItem);

    // If no worker node configured or available, make direct request
    if (!node) {
      const resp = await fetch(targetUrl, {
        ...options,
        // @ts-ignore Node.js keepAlive option
        keepalive: true,
      });
      return { response: resp, usedNode: null };
    }

    // Prepare proxy payload for worker node
    const startTime = Date.now();
    try {
      const headersRecord: Record<string, string> = {};
      if (options.headers) {
        if (options.headers instanceof Headers) {
          options.headers.forEach((val, key) => { headersRecord[key] = val; });
        } else if (Array.isArray(options.headers)) {
          options.headers.forEach(([k, v]) => { headersRecord[k] = v; });
        } else {
          Object.assign(headersRecord, options.headers);
        }
      }

      let bodyString: string | undefined = undefined;
      if (options.body) {
        if (typeof options.body === 'string') {
          bodyString = options.body;
        } else {
          bodyString = JSON.stringify(options.body);
        }
      }

      const proxyPayload = {
        url: targetUrl,
        method: options.method || 'POST',
        headers: headersRecord,
        body: bodyString,
      };

      // Set a generous 90-second timeout for streaming long AI completions
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 90000);

      // Chain with caller's signal if present
      if (options.signal) {
        options.signal.addEventListener('abort', () => controller.abort());
      }

      const proxyResp = await fetch(node.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Proxy-Secret': node.secret || '',
          'User-Agent': 'iportal-ai-gateway/1.0',
          'Connection': 'keep-alive',
        },
        body: JSON.stringify(proxyPayload),
        signal: controller.signal,
        // @ts-ignore
        keepalive: true,
      });

      clearTimeout(timeoutId);
      const latency = Date.now() - startTime;

      if (proxyResp.ok || proxyResp.status === 429) {
        CircuitBreaker.recordNodeSuccess(node, latency);
        return { response: proxyResp, usedNode: node };
      } else {
        console.warn(`[LoadBalancer] Node ${node.name} returned status ${proxyResp.status}`);
        CircuitBreaker.recordNodeFailure(node, `Status ${proxyResp.status}`);
        // Seamless fallback to direct fetch
        const directResp = await fetch(targetUrl, options);
        return { response: directResp, usedNode: null };
      }
    } catch (err: any) {
      console.error(`[LoadBalancer] Worker Node ${node.name} (${node.url}) error or timeout:`, err.message);
      CircuitBreaker.recordNodeFailure(node, err.message);
      // Seamless fallback to direct fetch without failing user stream
      const directResp = await fetch(targetUrl, options);
      return { response: directResp, usedNode: null };
    }
  }
}
