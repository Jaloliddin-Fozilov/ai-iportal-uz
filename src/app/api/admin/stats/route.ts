import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, findUserById } from '@/lib/storage/userStore';
import { loadClusterStats } from '@/lib/storage/statsStore';
import { loadStore } from '@/lib/storage/dataStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

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

    const stats = loadClusterStats();
    const dataStore = loadStore();

    // Enrich nodes from dataStore with live stats
    const activeNodes = dataStore.workerNodes.map(node => {
      const stat = stats.nodes[node.name] || stats.nodes[node.url] || {
        requestsCount: 0,
        successCount: 0,
        failCount: 0,
      };
      return {
        ...node,
        requestsCount: stat.requestsCount || 0,
        successCount: stat.successCount || 0,
        failCount: stat.failCount || 0,
        lastUsedAt: stat.lastUsedAt,
      };
    });

    // Enrich provider keys with request counts
    const activeProviders = dataStore.providerKeys.map(pk => {
      const provStat = stats.providers[pk.provider] || {
        requestsCount: 0,
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      };
      return {
        ...pk,
        providerRequests: provStat.requestsCount || 0,
        providerTokens: provStat.totalTokens || 0,
      };
    });

    return NextResponse.json({
      success: true,
      stats: {
        totalRequests: stats.totalRequests,
        totalPromptTokens: stats.totalPromptTokens,
        totalCompletionTokens: stats.totalCompletionTokens,
        totalTokens: stats.totalTokens,
        providers: stats.providers,
        nodes: stats.nodes,
        models: stats.models,
        recentLogs: stats.recentLogs,
      },
      activeNodes,
      activeProviders,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
