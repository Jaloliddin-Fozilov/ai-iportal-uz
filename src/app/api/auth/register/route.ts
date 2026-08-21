import { NextRequest, NextResponse } from 'next/server';
import { registerUser, generateSessionToken } from '@/lib/storage/userStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password } = await req.json();

    if (!email || !password || password.length < 6) {
      return NextResponse.json(
        { success: false, error: 'Email va kamida 6 belgidan iborat parol kiritilishi shart.' },
        { status: 400 }
      );
    }

    const newUser = registerUser(name || '', email, password);
    const token = generateSessionToken(newUser);

    return NextResponse.json({
      success: true,
      message: 'Muvaffaqiyatli ro\'yxatdan o\'tdingiz! Sizga $5.00 bepul balans berildi 🎁',
      token,
      user: {
        id: newUser.id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        balance: newUser.balance,
        apiKeys: newUser.apiKeys,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Ro\'yxatdan o\'tishda xatolik' },
      { status: 400 }
    );
  }
}
