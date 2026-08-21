import { NextRequest, NextResponse } from 'next/server';
import { getProviderKeys, addProviderKey, removeProviderKey } from '@/lib/storage/dataStore';
import { masterRouter } from '@/lib/core/router';
import { ProviderId } from '@/lib/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = getProviderKeys();
  return NextResponse.json({ success: true, keys });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { provider, key } = body;

    if (!provider || !key) {
      return NextResponse.json(
        { success: false, error: 'Provayder nomi va API Kalit kiritilishi shart' },
        { status: 400 }
      );
    }

    const newKeyItem = addProviderKey(provider as ProviderId, key);
    return NextResponse.json({ success: true, keyItem: newKeyItem });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Provayder kalitini qo\'shishda xatolik' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID kiritilmadi' }, { status: 400 });
    }

    const ok = removeProviderKey(id);
    return NextResponse.json({ success: ok });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'O\'chirishda xatolik' },
      { status: 400 }
    );
  }
}

// Test a provider directly
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { providerId, model } = body;

    const provider = masterRouter.getProvider(providerId as ProviderId);
    if (!provider) {
      return NextResponse.json({ success: false, error: 'Provayder topilmadi' }, { status: 404 });
    }

    const allKeys = getProviderKeys(providerId as ProviderId);
    if (allKeys.length === 0) {
      return NextResponse.json(
        { success: false, error: `${providerId} uchun hech qanday API kalit topilmadi` },
        { status: 400 }
      );
    }

    const keyItem = allKeys[0];
    const startTime = Date.now();

    const response = await provider.chat(
      {
        model: model || 'iportal-ai',
        messages: [{ role: 'user', content: 'Say "OK" in 1 word' }],
        stream: false,
        max_tokens: 10,
      },
      keyItem
    );

    const latency = Date.now() - startTime;
    return NextResponse.json({
      success: true,
      provider: providerId,
      latencyMs: latency,
      response: response.response,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Sinov so\'rovida xatolik' },
      { status: 500 }
    );
  }
}
