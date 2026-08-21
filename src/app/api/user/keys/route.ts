import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, findUserById, saveUserStore, loadUserStore } from '@/lib/storage/userStore';
import { ApiKeyItem } from '@/lib/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAuthUser(req: NextRequest) {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  const { valid, payload } = verifySessionToken(token);
  if (!valid || !payload) return null;
  return findUserById(payload.userId);
}

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
  }

  return NextResponse.json({ success: true, keys: user.apiKeys, balance: user.balance });
}

export async function POST(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
  }

  try {
    const { name } = await req.json();
    const keySuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    const newKey: ApiKeyItem = {
      id: `key-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      key: `ip-live-${keySuffix}`,
      name: name?.trim() || 'API Key',
      createdAt: Date.now(),
      requestsCount: 0,
      status: 'active',
      rateLimitPerMin: 120,
    };

    user.apiKeys.unshift(newKey);
    saveUserStore(loadUserStore());

    return NextResponse.json({ success: true, key: newKey });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  const idx = user.apiKeys.findIndex(k => k.id === id);
  if (idx !== -1) {
    user.apiKeys.splice(idx, 1);
    saveUserStore(loadUserStore());
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Kalit topilmadi' }, { status: 404 });
}
