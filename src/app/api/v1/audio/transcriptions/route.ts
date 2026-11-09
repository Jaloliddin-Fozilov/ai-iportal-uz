import { NextRequest, NextResponse } from 'next/server';
import { transcribeAudio } from '@/lib/ai/audioService';
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
            message: `Juda ko'p audio so'rov yuborildi. Iltimos ${ipCheck.resetInSec} soniyadan so'ng qayta urinib ko'ring.`,
            type: 'rate_limit_error',
            code: 'ip_rate_limit_exceeded',
          },
        },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': String(ipCheck.resetInSec) } }
      );
    }

    // 2. Authentication Check
    const authHeader = req.headers.get('authorization') || '';
    const userSessionToken = req.headers.get('x-user-token') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    let authenticatedUserId: string | null = null;
    let usedApiKeyId: string | undefined = undefined;
    let isMasterKey = false;

    if (token) {
      if (token === process.env.IPORTAL_MASTER_KEY || token === 'ip-master-secret-key-change-me') {
        isMasterKey = true;
      } else {
        const { user, keyItem } = findUserByApiKey(token);
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
          const { valid } = validateApiKey(token);
          if (!valid) {
            return NextResponse.json(
              {
                error: {
                  message: 'Noto\'g\'ri yoki bekor qilingan API Key. Yangi kalitni https://ai.iportal.uz dan oling.',
                  type: 'invalid_request_error',
                  code: 'invalid_api_key',
                },
              },
              { status: 401, headers: corsHeaders }
            );
          }
        }
      }
    } else if (userSessionToken) {
      const { valid, payload } = verifySessionToken(userSessionToken);
      if (valid && payload) {
        const user = findUserById(payload.userId);
        if (user) {
          authenticatedUserId = user.id;
        }
      }
    }

    // 3. Parse Multipart Form Data
    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    const model = (formData.get('model') as string) || 'iportal-audio-stt';
    const language = (formData.get('language') as string) || 'uz';
    const prompt = (formData.get('prompt') as string) || undefined;
    const responseFormat = (formData.get('response_format') as string) || 'json';

    if (!file) {
      return NextResponse.json(
        {
          error: {
            message: 'Audio fayl yuborilmadi (file maydoni talab qilinadi).',
            type: 'invalid_request_error',
            code: 'missing_file',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Check size limit (max 25MB)
    if (file.size > 25 * 1024 * 1024) {
      return NextResponse.json(
        {
          error: {
            message: 'Audio hajmi 25MB dan oshmasligi kerak.',
            type: 'invalid_request_error',
            code: 'file_too_large',
          },
        },
        { status: 413, headers: corsHeaders }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // 4. Transcribe Audio
    const result = await transcribeAudio({
      buffer,
      filename: file.name || 'audio.mp3',
      mimeType: file.type || 'audio/mpeg',
      language,
      prompt,
    });

    // 5. Deduct Balance & Record Stats
    if (authenticatedUserId && !isMasterKey) {
      deductUserBalance(
        authenticatedUserId,
        'iportal-audio-stt',
        Math.ceil(buffer.length / 1000),
        result.text.length,
        usedApiKeyId
      );
    }

    recordRequestStats({
      model: 'iportal-audio-stt',
      provider: result.provider === 'elevenlabs' ? 'elevenlabs' : 'groq',
      latencyMs: Date.now() - startTime,
      promptTokens: Math.ceil(buffer.length / 1000),
      completionTokens: result.text.length,
      status: 'success',
    });

    if (responseFormat === 'text') {
      return new NextResponse(result.text, {
        headers: { ...corsHeaders, 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }

    if (responseFormat === 'verbose_json') {
      return NextResponse.json(
        {
          task: 'transcribe',
          language: result.language || 'uz',
          duration: (Date.now() - startTime) / 1000,
          text: result.text,
          model: 'iportal-audio-stt',
        },
        { headers: corsHeaders }
      );
    }

    return NextResponse.json(
      {
        text: result.text,
      },
      { headers: corsHeaders }
    );
  } catch (err: any) {
    recordRequestStats({
      model: 'iportal-audio-stt',
      provider: 'groq',
      latencyMs: Date.now() - startTime,
      promptTokens: 0,
      completionTokens: 0,
      status: 'error',
      errorMessage: err.message,
    });

    return NextResponse.json(
      {
        error: {
          message: err.message || 'Audio transkripsiyasida xatolik yuz berdi.',
          type: 'api_error',
          code: 'transcription_failed',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
