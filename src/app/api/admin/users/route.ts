import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken, findUserById, loadUserStore, saveUserStore } from '@/lib/storage/userStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function checkAdminAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  // Check master key
  if (token === process.env.IPORTAL_MASTER_KEY || token === 'ip-master-secret-key-change-me') {
    return true;
  }

  // Check JWT session
  const { valid, payload } = verifySessionToken(token);
  if (!valid || !payload) return false;
  const user = findUserById(payload.userId);
  return user?.role === 'admin';
}

export async function GET(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Faqat Administrator uchun ruxsat berilgan' }, { status: 403 });
  }

  const store = loadUserStore();
  const safeUsers = store.users.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    balance: u.balance,
    totalSpent: u.totalSpent,
    totalRequests: u.totalRequests,
    status: u.status,
    createdAt: u.createdAt,
    lastLoginAt: u.lastLoginAt,
    apiKeysCount: u.apiKeys.length,
  }));

  return NextResponse.json({
    success: true,
    users: safeUsers,
    totalUsers: safeUsers.length,
    totalTransactions: store.transactions.length,
  });
}

export async function PUT(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan' }, { status: 403 });
  }

  try {
    const { userId, addBalance, setBalance, status } = await req.json();
    const store = loadUserStore();
    const user = store.users.find(u => u.id === userId);

    if (!user) {
      return NextResponse.json({ success: false, error: 'Foydalanuvchi topilmadi' }, { status: 404 });
    }

    if (addBalance !== undefined) {
      user.balance = parseFloat((user.balance + parseFloat(addBalance)).toFixed(4));
    } else if (setBalance !== undefined) {
      user.balance = parseFloat(parseFloat(setBalance).toFixed(4));
    }

    if (status) {
      user.status = status;
    }

    saveUserStore(store);
    return NextResponse.json({ success: true, user });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkAdminAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan' }, { status: 403 });
  }

  const { searchParams } = new URL(req.url);
  const userId = searchParams.get('userId');

  const store = loadUserStore();
  const idx = store.users.findIndex(u => u.id === userId);

  if (idx !== -1) {
    if (store.users[idx].role === 'admin') {
      return NextResponse.json({ success: false, error: 'Admin hisobini o\'chirish mumkin emas' }, { status: 400 });
    }
    store.users.splice(idx, 1);
    saveUserStore(store);
    return NextResponse.json({ success: true });
  }

  return NextResponse.json({ success: false, error: 'Foydalanuvchi topilmadi' }, { status: 404 });
}
