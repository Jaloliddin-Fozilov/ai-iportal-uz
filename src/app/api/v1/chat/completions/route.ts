import { NextRequest, NextResponse } from 'next/server';
import { masterRouter } from '@/lib/core/router';
import { validateApiKey } from '@/lib/storage/dataStore';
import { SecurityGuard } from '@/lib/core/security';
import { ChatCompletionRequest } from '@/lib/core/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With, X-Client',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
};

export async function OPTIONS() {
  return new NextResponse(null, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    // 1. Extract Client IP
    const clientIp = 
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    // 2. IP Rate Limit Guard (60 req/min for general protection)
    const ipCheck = SecurityGuard.checkIpRateLimit(clientIp, 80);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            message: `Juda ko'p so'rov yuborildi. Iltimos ${ipCheck.resetInSec} soniyadan so'ng qayta urinib ko'ring (Rate Limit Exceeded).`,
            type: 'rate_limit_error',
            code: 'ip_rate_limit_exceeded',
          },
        },
        { 
          status: 429, 
          headers: {
            ...corsHeaders,
            'Retry-After': String(ipCheck.resetInSec),
          } 
        }
      );
    }

    // 3. Authenticate Request
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();
    const isWebClient = req.headers.get('x-client') === 'web-chat';

    if (!isWebClient) {
      if (!token) {
        return NextResponse.json(
          {
            error: {
              message: 'API Key kiritilmadi. Iltimos "Authorization: Bearer ip-live-..." sarlavhasini yuboring.',
              type: 'invalid_request_error',
              code: 'missing_api_key',
            },
          },
          { status: 401, headers: corsHeaders }
        );
      }

      const { valid, keyItem } = validateApiKey(token);
      if (!valid || !keyItem) {
        return NextResponse.json(
          {
            error: {
              message: 'Noto\'g\'ri yoki bekor qilingan API Key. Yangi kalitni https://ai.iportal.uz manzilidan oling.',
              type: 'invalid_request_error',
              code: 'invalid_api_key',
            },
          },
          { status: 401, headers: corsHeaders }
        );
      }

      // Per-Key Rate Limit Check
      const keyLimit = keyItem.rateLimitPerMin || 120;
      const keyCheck = SecurityGuard.checkKeyRateLimit(keyItem.key, keyLimit);
      if (!keyCheck.allowed) {
        return NextResponse.json(
          {
            error: {
              message: `Ushbu API Kalit limiti oshdi (${keyLimit} req/min). Iltimos, birozdan so'ng urinib ko'ring.`,
              type: 'rate_limit_error',
              code: 'key_rate_limit_exceeded',
            },
          },
          { status: 429, headers: corsHeaders }
        );
      }
    }

    // 4. Parse & Sanitize Body
    const body: ChatCompletionRequest = await req.json();

    if (!body.messages || !Array.isArray(body.messages) || body.messages.length === 0) {
      return NextResponse.json(
        {
          error: {
            message: '"messages" massivi bo\'sh bo\'lishi mumkin emas.',
            type: 'invalid_request_error',
            code: 'invalid_messages',
          },
        },
        { status: 400, headers: corsHeaders }
      );
    }

    // Sanitize messages content
    body.messages = body.messages.map(m => ({
      role: m.role,
      content: SecurityGuard.sanitizeInput(m.content),
    }));

    // Default to streaming if not specified
    const isStreaming = body.stream !== false;
    body.stream = isStreaming;

    // 5. Execute through Master Router with Multi-Provider & Multi-Key Failover
    const result = await masterRouter.executeChat(body);

    if (isStreaming && result.stream) {
      return new Response(result.stream, {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          'X-Accel-Buffering': 'no',
          'X-Used-Provider': result.usedKey.provider,
          'X-Used-Node': result.usedNode?.name || 'Direct',
          ...corsHeaders,
        },
      });
    } else {
      return NextResponse.json(result.response, {
        headers: {
          'X-Used-Provider': result.usedKey.provider,
          'X-Used-Node': result.usedNode?.name || 'Direct',
          ...corsHeaders,
        },
      });
    }
  } catch (err: any) {
    console.error('[API /v1/chat/completions Error]:', err);
    return NextResponse.json(
      {
        error: {
          message: err.message || 'Serverda kutilmagan xatolik yuz berdi.',
          type: 'api_error',
          code: 'internal_error',
        },
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
