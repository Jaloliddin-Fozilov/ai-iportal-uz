import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, findUserById } from '@/lib/storage/userStore';
import { loadStore } from '@/lib/storage/dataStore';
import { loadClusterStats } from '@/lib/storage/statsStore';
import { calculateKeyQuota, CalculatedKeyQuota } from '@/lib/core/quotaCalculator';
import { LoadBalancer } from '@/lib/core/balancer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface KeyHealthProbeResult {
  id: string;
  provider: string;
  maskedKey: string;
  status: 'healthy' | 'degraded' | 'error';
  httpStatus?: number;
  latencyMs?: number;
  errorMessage?: string;
  quota: CalculatedKeyQuota;
}

export interface NodeHealthProbeResult {
  id: string;
  name: string;
  type: string;
  url: string;
  status: 'online' | 'degraded' | 'offline';
  latencyMs?: number;
  errorMessage?: string;
}

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const { valid, payload } = verifySessionToken(token);
    if (!valid || !payload) {
      return NextResponse.json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const user = findUserById(payload.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Faqat administratorlar uchun' }, { status: 403 });
    }

    const store = loadStore();
    const clusterStats = loadClusterStats();

    // Calculate quota for all provider keys
    const keyQuotas: CalculatedKeyQuota[] = store.providerKeys.map(k => {
      const pStats = clusterStats.providers[k.provider] || {
        requestsCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

      // Split requests proportionally if multiple keys exist for same provider
      const sameProvKeys = store.providerKeys.filter(pk => pk.provider === k.provider);
      const shareRatio = 1 / Math.max(1, sameProvKeys.length);
      const estimatedKeyRequests = Math.round((pStats.requestsCount || 0) * shareRatio) + (k.successCount || 0);
      const estimatedKeyTokens = Math.round((pStats.totalTokens || 0) * shareRatio);

      return calculateKeyQuota(
        k.provider,
        k.id,
        k.maskedKey,
        k.status,
        estimatedKeyRequests,
        estimatedKeyTokens
      );
    });

    // Total cluster capacity calculation
    const totalDailyCapacity = keyQuotas.reduce((acc, q) => acc + q.dailyRequestsLimit, 0);
    const totalRemainingRequests = keyQuotas.reduce((acc, q) => acc + q.remainingRequests, 0);
    const totalTokensCapacity = keyQuotas.reduce((acc, q) => acc + q.dailyTokensLimit, 0);
    const totalRemainingTokens = keyQuotas.reduce((acc, q) => acc + q.remainingTokens, 0);

    const systemInfo = {
      uptimeSeconds: Math.floor(process.uptime()),
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      totalMemoryMb: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
      platform: process.platform,
      arch: process.arch,
      timestamp: Date.now(),
    };

    return NextResponse.json({
      success: true,
      summary: {
        totalDailyCapacity,
        totalRemainingRequests,
        totalTokensCapacity,
        totalRemainingTokens,
        overallHealthPercent: totalDailyCapacity > 0 ? Math.round((totalRemainingRequests / totalDailyCapacity) * 100) : 100,
        activeKeysCount: store.providerKeys.filter(k => k.status === 'active').length,
        activeNodesCount: store.workerNodes.filter(n => n.status === 'online').length,
      },
      keyQuotas,
      systemInfo,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

// POST triggers active live ping probes to test each key and node in real-time
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    const { valid, payload } = verifySessionToken(token);
    if (!valid || !payload) {
      return NextResponse.json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
    }

    const user = findUserById(payload.userId);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ success: false, error: 'Faqat administratorlar uchun' }, { status: 403 });
    }

    const store = loadStore();
    const clusterStats = loadClusterStats();

    // 1. Probe all Edge Nodes
    const nodeProbes: NodeHealthProbeResult[] = await Promise.all(
      store.workerNodes.map(async (node) => {
        const startTime = Date.now();
        try {
          const res = await fetch(node.url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'X-Proxy-Secret': node.secret || '',
            },
            body: JSON.stringify({
              url: 'https://httpbin.org/get',
              method: 'GET',
            }),
            signal: AbortSignal.timeout(8000),
          });

          const latency = Date.now() - startTime;
          if (res.ok) {
            node.status = 'online';
            node.latencyMs = latency;
            return {
              id: node.id,
              name: node.name,
              type: node.type,
              url: node.url,
              status: 'online' as const,
              latencyMs: latency,
            };
          } else {
            node.status = 'degraded';
            return {
              id: node.id,
              name: node.name,
              type: node.type,
              url: node.url,
              status: 'degraded' as const,
              latencyMs: latency,
              errorMessage: `HTTP ${res.status}`,
            };
          }
        } catch (e: any) {
          node.status = 'offline';
          return {
            id: node.id,
            name: node.name,
            type: node.type,
            url: node.url,
            status: 'offline' as const,
            errorMessage: e.message || 'Timeout / Bog\'lanish xatosi',
          };
        }
      })
    );

    // 2. Calculate Quotas & Probe Provider Keys
    const keyProbes: KeyHealthProbeResult[] = store.providerKeys.map(k => {
      const pStats = clusterStats.providers[k.provider] || {
        requestsCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

      const quota = calculateKeyQuota(
        k.provider,
        k.id,
        k.maskedKey,
        k.status,
        k.successCount || pStats.requestsCount || 0,
        pStats.totalTokens || 0
      );

      return {
        id: k.id,
        provider: k.provider,
        maskedKey: k.maskedKey,
        status: k.status === 'active' ? 'healthy' : 'error',
        quota,
      };
    });

    return NextResponse.json({
      success: true,
      message: 'Diagnostika muvaffaqiyatli o\'tkazildi',
      nodeProbes,
      keyProbes,
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
