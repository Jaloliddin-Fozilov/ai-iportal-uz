import { NextRequest, NextResponse } from 'next/server';
import { getAllApiKeys, createApiKey, revokeApiKey, deleteApiKey } from '@/lib/storage/dataStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const keys = getAllApiKeys();
  return NextResponse.json({ success: true, keys });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, customKey, rateLimitPerMin } = body;

    const newKey = createApiKey(name, customKey, rateLimitPerMin);
    return NextResponse.json({ success: true, key: newKey });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Kalit yaratishda xatolik' },
      { status: 400 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    const action = searchParams.get('action') || 'delete';

    if (!id) {
      return NextResponse.json({ success: false, error: 'ID berilmadi' }, { status: 400 });
    }

    if (action === 'revoke') {
      const ok = revokeApiKey(id);
      return NextResponse.json({ success: ok });
    } else {
      const ok = deleteApiKey(id);
      return NextResponse.json({ success: ok });
    }
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'O\'chirishda xatolik' },
      { status: 400 }
    );
  }
}
