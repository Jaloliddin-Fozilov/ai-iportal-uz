import { NextResponse } from 'next/server';
import { loadStore } from '@/lib/storage/dataStore';
import { IPORTAL_MODELS } from '@/lib/core/models';
import { CircuitBreaker } from '@/lib/core/circuitBreaker';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const store = loadStore();

  const providerStats = store.providerKeys.map(k => ({
    id: k.id,
    provider: k.provider,
    maskedKey: k.maskedKey,
    status: CircuitBreaker.isKeyAvailable(k) ? 'ready' : 'cooling_down',
    successCount: k.successCount,
    failCount: k.failCount,
    lastUsedAt: k.lastUsedAt,
  }));

  const nodeStats = store.workerNodes.map(n => ({
    id: n.id,
    name: n.name,
    type: n.type,
    url: n.url,
    status: CircuitBreaker.isNodeAvailable(n) ? n.status : 'cooling_down',
    latencyMs: n.latencyMs,
    failureCount: n.failureCount,
  }));

  return NextResponse.json({
    status: 'online',
    version: '1.0.0',
    gateway: 'ai.iportal.uz',
    totalModels: IPORTAL_MODELS.length,
    activeKeysCount: store.apiKeys.filter(k => k.status === 'active').length,
    providerKeysCount: store.providerKeys.length,
    workerNodesCount: store.workerNodes.length,
    providers: providerStats,
    nodes: nodeStats,
    timestamp: Date.now(),
  });
}
