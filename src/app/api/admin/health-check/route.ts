import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, findUserById } from '@/lib/storage/userStore';
import { loadStore, saveStore } from '@/lib/storage/dataStore';
import { loadClusterStats } from '@/lib/storage/statsStore';
import { calculateKeyQuota, CalculatedKeyQuota } from '@/lib/core/quotaCalculator';
import { extractRealQuota } from '@/lib/providers/base';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export interface KeyHealthProbeResult {
  id: string;
  provider: string;
  maskedKey: string;
  status: 'healthy' | 'warning' | 'exhausted' | 'error';
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

    // Calculate quota for all provider keys (prioritizing real live data if available)
    const keyQuotas: CalculatedKeyQuota[] = store.providerKeys.map(k => {
      const pStats = clusterStats.providers[k.provider] || {
        requestsCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };

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
        estimatedKeyTokens,
        k.realQuota
      );
    });

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

// POST triggers real live HTTP test probes to capture EXACT live headers & rate-limits from Groq, Cerebras, Gemini, etc.
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

    // 1. Probe all Edge Nodes in parallel
    const nodeProbes: NodeHealthProbeResult[] = await Promise.all(
      store.workerNodes.map(async (node) => {
        const startTime = Date.now();
        try {
          const res = await fetch(node.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'iportal-ai-probe',
            },
            signal: AbortSignal.timeout(6000),
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
            node.latencyMs = latency;
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

    // 2. Perform Real Live Probes on each AI Provider Key to read exact headers
    const keyProbes: KeyHealthProbeResult[] = await Promise.all(
      store.providerKeys.map(async (k) => {
        const startTime = Date.now();
        let httpStatus = 200;
        let errorMessage: string | undefined;

        try {
          let probeUrl = '';
          let probeHeaders: Record<string, string> = {};
          let probeBody: string | undefined;
          let method = 'POST';

          if (k.provider === 'groq') {
            probeUrl = 'https://api.groq.com/openai/v1/chat/completions';
            probeHeaders = {
              'Authorization': `Bearer ${k.key}`,
              'Content-Type': 'application/json',
            };
            probeBody = JSON.stringify({
              model: 'openai/gpt-oss-20b',
              messages: [{ role: 'user', content: 'hi' }],
              max_tokens: 1,
            });
          } else if (k.provider === 'cerebras') {
            probeUrl = 'https://api.cerebras.ai/v1/chat/completions';
            probeHeaders = {
              'Authorization': `Bearer ${k.key}`,
              'Content-Type': 'application/json',
            };
            probeBody = JSON.stringify({
              model: 'llama3.1-8b',
              messages: [{ role: 'user', content: 'hi' }],
              max_tokens: 1,
            });
          } else if (k.provider === 'gemini') {
            method = 'GET';
            probeUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${k.key}`;
          } else if (k.provider === 'openrouter') {
            method = 'GET';
            probeUrl = 'https://openrouter.ai/api/v1/auth/key';
            probeHeaders = { 'Authorization': `Bearer ${k.key}` };
          } else if (k.provider === 'mistral') {
            method = 'GET';
            probeUrl = 'https://api.mistral.ai/v1/models';
            probeHeaders = { 'Authorization': `Bearer ${k.key}` };
          } else if (k.provider === 'sambanova') {
            probeUrl = 'https://api.sambanova.ai/v1/chat/completions';
            probeHeaders = {
              'Authorization': `Bearer ${k.key}`,
              'Content-Type': 'application/json',
            };
            probeBody = JSON.stringify({
              model: 'DeepSeek-R1-Distill-Llama-70B',
              messages: [{ role: 'user', content: 'hi' }],
              max_tokens: 1,
            });
          } else {
            method = 'GET';
            probeUrl = 'https://api.cloudflare.com/client/v4/user/tokens/verify';
            probeHeaders = { 'Authorization': `Bearer ${k.key}` };
          }

          const res = await fetch(probeUrl, {
            method,
            headers: probeHeaders,
            body: probeBody,
            signal: AbortSignal.timeout(8000),
          });

          const latency = Date.now() - startTime;
          httpStatus = res.status;

          let errorText: string | undefined;
          if (!res.ok) {
            errorText = await res.text().catch(() => '');
            errorMessage = `HTTP ${res.status}: ${errorText.slice(0, 100)}`;
          }

          // Extract 100% Real Live Quota Headers
          const realQuota = extractRealQuota(res.headers, res.status, errorText);
          realQuota.latencyMs = latency;
          realQuota.httpStatus = res.status;
          if (errorMessage) realQuota.errorMessage = errorMessage;

          k.realQuota = realQuota;
          k.lastUsedAt = Date.now();

          if (res.status === 401 || res.status === 403) {
            k.status = 'error';
            k.errorReason = 'Noto\'g\'ri API kalit';
          } else if (res.status === 429) {
            k.status = 'cooling_down';
            k.errorReason = realQuota.rateLimitType || 'Rate limit';
          } else if (res.ok) {
            k.status = 'active';
            k.errorReason = undefined;
          }
        } catch (err: any) {
          httpStatus = 0;
          errorMessage = err.message || 'Timeout / Bog\'lanish xatosi';
          k.realQuota = {
            httpStatus: 0,
            errorMessage,
            lastChecked: Date.now(),
            latencyMs: Date.now() - startTime,
          };
        }

        const quota = calculateKeyQuota(
          k.provider,
          k.id,
          k.maskedKey,
          k.status,
          k.successCount || 0,
          0,
          k.realQuota
        );

        return {
          id: k.id,
          provider: k.provider,
          maskedKey: k.maskedKey,
          status: quota.healthStatus,
          httpStatus,
          latencyMs: k.realQuota?.latencyMs,
          errorMessage,
          quota,
        };
      })
    );

    // Save updated real quotas to store
    saveStore(store);

    return NextResponse.json({
      success: true,
      message: 'Jonli diagnostika o\'tkazildi va real limitlar yangilandi',
      nodeProbes,
      keyProbes,
      keyQuotas: keyProbes.map(kp => kp.quota),
      timestamp: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
