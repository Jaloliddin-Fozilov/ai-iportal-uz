import { NextResponse } from 'next/server';
import { getWorkerNodes, updateWorkerNodeStatus } from '@/lib/storage/dataStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Ushbu endpoint bepul hosting workerlarini "uyg'oq" (Warm) holatda ushlab turish
 * va kechikishni (ping latency) yangilab borish uchun xizmat qiladi.
 * Bepul cron (cron-job.org yoki UptimeRobot) orqali har 5 daqiqada chaqirib turish mumkin.
 */
export async function GET() {
  const nodes = getWorkerNodes();

  const pingResults = await Promise.allSettled(
    nodes.map(async (node) => {
      const startTime = Date.now();
      const resp = await fetch(node.url, {
        method: 'GET',
        headers: { 'User-Agent': 'iportal-ai-keep-warm' },
        signal: AbortSignal.timeout(4000),
      });

      const latency = Date.now() - startTime;
      if (resp.ok) {
        updateWorkerNodeStatus(node.id, 'online', latency);
        return { id: node.id, name: node.name, status: 'online', latencyMs: latency };
      } else {
        updateWorkerNodeStatus(node.id, 'degraded', latency);
        return { id: node.id, name: node.name, status: 'degraded', latencyMs: latency };
      }
    })
  );

  return NextResponse.json({
    success: true,
    message: 'Worker nodelar uyg\'oq holatda saqlandi va tekshirildi',
    results: pingResults.map(r => r.status === 'fulfilled' ? r.value : { status: 'offline' }),
    timestamp: Date.now(),
  });
}
