import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, findUserById } from '@/lib/storage/userStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ success: false, error: 'Token mavjud emas' }, { status: 401 });
    }

    const { valid, payload } = verifySessionToken(token);
    if (!valid || !payload) {
      return NextResponse.json({ success: false, error: 'Sessiya muddati tugagan' }, { status: 401 });
    }

    const user = findUserById(payload.userId);
    if (!user) {
      return NextResponse.json({ success: false, error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        balance: user.balance,
        totalSpent: user.totalSpent,
        totalRequests: user.totalRequests,
        status: user.status,
        apiKeys: user.apiKeys,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Server xatoligi' },
      { status: 500 }
    );
  }
}
