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

import { calculateBillingMetrics } from '@/lib/core/billingCalculator';

export async function GET(req: NextRequest) {
  const user = getAuthUser(req);
  if (!user) {
    return NextResponse.json({ success: false, error: 'Avtorizatsiyadan o\'tilmagan' }, { status: 401 });
  }

  const totalPrompt = user.apiKeys.reduce((acc, k) => acc + (k.promptTokens || 0), 0);
  const totalCompletion = user.apiKeys.reduce((acc, k) => acc + (k.completionTokens || 0), 0);
  const totalReqs = user.apiKeys.reduce((acc, k) => acc + (k.requestsCount || 0), 0);
  const billingReport = calculateBillingMetrics(totalPrompt, totalCompletion, totalReqs);

  const keysWithSavings = user.apiKeys.map(k => {
    const kPrompt = k.promptTokens || 0;
    const kComp = k.completionTokens || 0;
    const kReqs = k.requestsCount || 0;
    const kMetrics = calculateBillingMetrics(kPrompt, kComp, kReqs);
    return {
      ...k,
      savedUsd: kMetrics.totalSavedUsd,
      savedUzs: kMetrics.totalSavedUzs,
      formattedSavedUsd: kMetrics.formattedTotalSavedUsd,
      formattedSavedUzs: kMetrics.formattedTotalSavedUzs,
      totalTokens: kPrompt + kComp,
    };
  });

  return NextResponse.json({ 
    success: true, 
    keys: keysWithSavings, 
    balance: user.balance,
    totalSpent: user.totalSpent,
    totalRequests: user.totalRequests,
    billingReport,
  });
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
