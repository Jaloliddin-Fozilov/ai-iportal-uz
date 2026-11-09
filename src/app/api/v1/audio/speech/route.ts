import { NextRequest, NextResponse } from 'next/server';
import { generateSpeech } from '@/lib/ai/audioService';
import { validateApiKey } from '@/lib/storage/dataStore';
import { findUserByApiKey, deductUserBalance, verifySessionToken, findUserById } from '@/lib/storage/userStore';
import { recordRequestStats } from '@/lib/storage/statsStore';
import { SecurityGuard } from '@/lib/core/security';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client, X-User-Token',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-Powered-By': 'iportal-ai',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  const startTime = Date.now();
  try {
    // 1. IP Rate Limiting Guard
    const clientIp = 
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const ipCheck = SecurityGuard.checkIpRateLimit(clientIp, 60);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            message: `Juda ko'p ovoz so'rovi yuborildi. Iltimos ${ipCheck.resetInSec} soniyadan so'ng qayta urinib ko'ring.`,
            type: 'rate_limit_error',
            code: 'ip_rate_limit_exceeded',
          },
        },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': String(ipCheck.resetInSec) } }
      );
    }

    // 2. Authentication Check (Supports API keys, Master Key, and JWT session tokens)
    const authHeader = req.headers.get('authorization') || '';
    const userSessionToken = req.headers.get('x-user-token') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const rawToken = token || userSessionToken;

    let authenticatedUserId: string | null = null;
    let usedApiKeyId: string | undefined = undefined;
    let isMasterKey = false;

    if (rawToken) {
      if (rawToken === process.env.IPORTAL_MASTER_KEY || rawToken === 'ip-master-secret-key-change-me') {
        isMasterKey = true;
      } else if (rawToken.startsWith('ip-live-') || rawToken.startsWith('ip-')) {
        // API Key
        const { user, keyItem } = findUserByApiKey(rawToken);
        if (user && keyItem) {
          authenticatedUserId = user.id;
          usedApiKeyId = keyItem.id;
          if (user.balance <= 0) {
            return NextResponse.json(
              {
                error: {
                  message: 'Balansingiz tugadi ($0.00). Iltimos, hisobingizni to\'ldiring.',
                  type: 'insufficient_quota',
                  code: 'insufficient_balance',
                },
              },
              { status: 402, headers: corsHeaders }
            );
          }
        } else {
          const { valid } = validateApiKey(rawToken);
          if (!valid) {
            return NextResponse.json(
              {
                error: {
                  message: 'Noto\'g\'ri API kalit.',
                  type: 'invalid_request_error',
                  code: 'invalid_api_key',
                },
              },
              { status: 401, headers: corsHeaders }
            );
          }
        }
      } else {
        // JWT session token
        const { valid, payload } = verifySessionToken(rawToken);
        if (valid && payload) {
          const user = findUserById(payload.userId);
          if (user) {
            authenticatedUserId = user.id;
          }
        }
      }
    }

    // 3. Parse JSON Body
    const body = await req.json().catch(() => ({}));
    const { 
      model = 'iportal-audio-tts', 
      input, 
      voice = 'uz-female', 
      speed = 1.0 
    } = body;

    if (!input || typeof input !== 'string' || !input.trim()) {
      return NextResponse.json(
        {
          error: {
            message: 'Ovozga aylantirish uchun matn kiritilmadi (input maydoni talab qilinadi).',
            type: 'invalid_request_error',
            code: 'missing_input',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    if (input.length > 4096) {
      return NextResponse.json(
        {
          error: {
            message: 'Bitta so\'rovda matn uzunligi 4096 belgidan oshmasligi kerak.',
            type: 'invalid_request_error',
            code: 'text_too_long',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // 4. Generate Speech
    const result = await generateSpeech({
      text: input,
      voice,
      speed: typeof speed === 'number' ? speed : 1.0,
      model,
    });

    // 5. Deduct Balance & Record Stats
    if (authenticatedUserId && !isMasterKey) {
      deductUserBalance(
        authenticatedUserId,
        'iportal-audio-tts',
        input.length,
        Math.ceil(result.audioBuffer.length / 1000),
        usedApiKeyId
      );
    }

    recordRequestStats({
      model: 'iportal-audio-tts',
      provider: result.provider === 'elevenlabs' ? 'elevenlabs' : 'msedge',
      latencyMs: Date.now() - startTime,
      promptTokens: input.length,
      completionTokens: Math.ceil(result.audioBuffer.length / 1000),
      status: 'success',
    });

    return new NextResponse(new Uint8Array(result.audioBuffer), {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'audio/mpeg',
        'Content-Length': String(result.audioBuffer.length),
        'Cache-Control': 'public, max-age=86400',
        'X-Model': 'iportal-audio-tts',
        'X-Voice': result.voice,
      },
    });
  } catch (err: any) {
    recordRequestStats({
      model: 'iportal-audio-tts',
      provider: 'msedge',
      latencyMs: Date.now() - startTime,
      promptTokens: 0,
      completionTokens: 0,
      status: 'error',
      errorMessage: err.message,
    });

    return NextResponse.json(
      {
        error: {
          message: err.message || 'Ovoz sintezida xatolik yuz berdi.',
          type: 'api_error',
          code: 'tts_failed',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
