import { NextRequest, NextResponse } from 'next/server';
import { getWorkerNodes, addWorkerNode, removeWorkerNode, updateWorkerNodeStatus } from '@/lib/storage/dataStore';
import { verifySessionToken, findUserById } from '@/lib/storage/userStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (token === process.env.IPORTAL_MASTER_KEY || token === 'ip-master-secret-key-change-me') {
    return true;
  }

  const { valid, payload } = verifySessionToken(token);
  if (!valid || !payload) return false;
  const user = findUserById(payload.userId);
  return user?.role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan (Faqat Admin)' }, { status: 403 });
  }

  const nodes = getWorkerNodes();
  return NextResponse.json({ success: true, nodes });
}

export async function POST(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan (Faqat Admin)' }, { status: 403 });
  }

  try {
    const body = await req.json();
    const { name, url, type, secret } = body;

    if (!url) {
      return NextResponse.json({ success: false, error: 'Worker Node URL manzili kiritilmadi' }, { status: 400 });
    }

    const newNode = addWorkerNode(name, url, type, secret);
    return NextResponse.json({ success: true, node: newNode });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Node qo\'shishda xatolik' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan (Faqat Admin)' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID berilmadi' }, { status: 400 });
    }

    const ok = removeWorkerNode(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'O\'chirishda xatolik' },
      { status: 400 }
    );
  }
}

// Ping / Test all or specific node
export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan (Faqat Admin)' }, { status: 403 });
  }

  try {
    const nodes = getWorkerNodes();
    const results = await Promise.all(
      nodes.map(async (node) => {
        const start = Date.now();
        try {
          const resp = await fetch(node.url, {
            method: 'GET',
            headers: {
              'User-Agent': 'iportal-ai-pinger',
            },
            signal: AbortSignal.timeout(5000),
          });

          const latency = Date.now() - start;
          if (resp.ok) {
            updateWorkerNodeStatus(node.id, 'online', latency);
            return { id: node.id, status: 'online', latencyMs: latency };
          } else {
            updateWorkerNodeStatus(node.id, 'degraded', latency);
            return { id: node.id, status: 'degraded', latencyMs: latency };
          }
        } catch (err: any) {
          updateWorkerNodeStatus(node.id, 'offline');
          return { id: node.id, status: 'offline', error: err.message };
        }
      })
    );

    return NextResponse.json({ success: true, results, nodes: getWorkerNodes() });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ping sinovida xatolik' },
      { status: 500 }
    );
  }
}
