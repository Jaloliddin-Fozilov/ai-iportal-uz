import { NextRequest, NextResponse } from 'next/server';
import { masterRouter } from '@/lib/core/router';
import { validateApiKey } from '@/lib/storage/dataStore';
import { findUserByApiKey, deductUserBalance, verifySessionToken, findUserById } from '@/lib/storage/userStore';
import { recordRequestStats } from '@/lib/storage/statsStore';
import { SecurityGuard } from '@/lib/core/security';
import { composeSystemMessages } from '@/lib/core/systemPrompt';
import { ChatCompletionRequest, ChatMessage } from '@/lib/core/types';

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
  try {
    // 1. IP Rate Limiting Guard (DDoS protection)
    const clientIp = 
      req.headers.get('cf-connecting-ip') ||
      req.headers.get('x-forwarded-for')?.split(',')[0].trim() ||
      req.headers.get('x-real-ip') ||
      '127.0.0.1';

    const ipCheck = SecurityGuard.checkIpRateLimit(clientIp, 100);
    if (!ipCheck.allowed) {
      return NextResponse.json(
        {
          error: {
            message: `Juda ko'p so'rov yuborildi. Iltimos ${ipCheck.resetInSec} soniyadan so'ng qayta urinib ko'ring.`,
            type: 'rate_limit_error',
            code: 'ip_rate_limit_exceeded',
          },
        },
        { status: 429, headers: { ...corsHeaders, 'Retry-After': String(ipCheck.resetInSec) } }
      );
    }

    // 2. Authentication & User Balance Check
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
        // Find user by API key
        const { user, keyItem } = findUserByApiKey(token);
        if (user && keyItem) {
          authenticatedUserId = user.id;
          usedApiKeyId = keyItem.id;

          if (user.balance <= 0) {
            return NextResponse.json(
              {
                error: {
                  message: 'Balansingiz tugadi ($0.00). Iltimos, hisobingizni to\'ldiring yoki yangi kalit oling.',
                  type: 'insufficient_quota',
                  code: 'insufficient_balance',
                },
              },
              { status: 402, headers: corsHeaders }
            );
          }
        } else {
          // Check global dataStore fallback
          const { valid } = validateApiKey(token);
          if (!valid) {
            return NextResponse.json(
              {
                error: {
                  message: 'Noto\'g\'ri yoki bekor qilingan API Key. Yangi kalitni https://ai.iportal.uz saytida ro\'yxatdan o\'tib oling (bepul $5 beriladi).',
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
      // Authenticated web chat user
      const { valid, payload } = verifySessionToken(userSessionToken);
      if (valid && payload) {
        const user = findUserById(payload.userId);
        if (user) {
          authenticatedUserId = user.id;
          if (user.balance <= 0 && user.role !== 'admin') {
            return NextResponse.json(
              {
                error: {
                  message: 'Balansingiz tugadi ($0.00). Iltimos hisobingizni to\'ldiring.',
                  type: 'insufficient_quota',
                  code: 'insufficient_balance',
                },
              },
              { status: 402, headers: corsHeaders }
            );
          }
        }
      }
    }

    // 3. Parse & Sanitize Request
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

    // 4. Inject Core Islamic & Legal System Safeguard (Invisible to user)
    let userCustomPrompt = '';
    const nonSystemMessages: ChatMessage[] = [];

    for (const msg of body.messages) {
      if (msg.role === 'system') {
        userCustomPrompt += (userCustomPrompt ? '\n' : '') + msg.content;
      } else {
        nonSystemMessages.push({
          role: msg.role,
          content: SecurityGuard.sanitizeInput(msg.content),
        });
      }
    }

    // Smart Sliding Window: If chat history is huge (> 18,000 chars / ~4,500 tokens), preserve the latest turns
    const systemSafeguard = composeSystemMessages(userCustomPrompt);
    let trimmedDialogue: ChatMessage[] = nonSystemMessages;

    const maxHistoryChars = 18000;
    const totalChars = nonSystemMessages.reduce((acc, m) => acc + (m.content?.length || 0), 0);

    if (totalChars > maxHistoryChars && nonSystemMessages.length > 2) {
      const lastMsg = nonSystemMessages[nonSystemMessages.length - 1];
      let currentLen = (lastMsg.content?.length || 0);
      const kept: ChatMessage[] = [];

      for (let i = nonSystemMessages.length - 2; i >= 0; i--) {
        const msg = nonSystemMessages[i];
        const len = msg.content?.length || 0;
        if (currentLen + len > maxHistoryChars) break;
        kept.unshift(msg);
        currentLen += len;
      }
      trimmedDialogue = [...kept, lastMsg];
    }

    // Always place composed system safeguard as first message
    body.messages = [
      systemSafeguard,
      ...trimmedDialogue,
    ];

    const isStreaming = body.stream !== false;
    body.stream = isStreaming;

    // Estimate Prompt Tokens
    const promptChars = body.messages.reduce((acc, m) => acc + (m.content?.length || 0), 0);
    const estimatedPromptTokens = Math.max(1, Math.ceil(promptChars / 4));

    const startTime = Date.now();

    // 5. Execute Chat through Master Router (routed via edge worker proxies)
    const result = await masterRouter.executeChat(body);

    const finalizeUsage = (completionTokens: number, status: 'success' | 'error' = 'success', errorMsg?: string) => {
      const latencyMs = Date.now() - startTime;
      recordRequestStats({
        provider: result?.usedKey?.provider || 'groq',
        nodeName: result?.usedNode?.name,
        nodeUrl: result?.usedNode?.url,
        nodeType: result?.usedNode?.type,
        model: body.model || 'iportal-ai',
        promptTokens: estimatedPromptTokens,
        completionTokens,
        latencyMs,
        status,
        errorMessage: errorMsg,
      });

      if (authenticatedUserId && !isMasterKey) {
        deductUserBalance(
          authenticatedUserId,
          body.model || 'iportal-ai',
          estimatedPromptTokens,
          completionTokens,
          usedApiKeyId
        );
      }
    };

    if (isStreaming && result.stream) {
      let outputTokens = 0;
      const transformStream = new TransformStream({
        transform(chunk, controller) {
          outputTokens += Math.max(1, Math.ceil(chunk.length / 4));
          controller.enqueue(chunk);
        },
        flush() {
          finalizeUsage(outputTokens);
        },
      });

      return new Response(result.stream.pipeThrough(transformStream), {
        headers: {
          'Content-Type': 'text/event-stream; charset=utf-8',
          'Cache-Control': 'no-cache, no-transform',
          'Connection': 'keep-alive',
          ...corsHeaders,
        },
      });
    } else {
      const completionText = result.response?.choices?.[0]?.message?.content || '';
      const completionTokens = Math.max(1, Math.ceil(completionText.length / 4));
      finalizeUsage(completionTokens);

      if (result.response) {
        result.response.model = body.model || 'iportal-ai';
      }

      return NextResponse.json(result.response, {
        headers: {
          ...corsHeaders,
        },
      });
    }
  } catch (err: any) {
    console.error('[API /v1/chat/completions Error]:', err);
    recordRequestStats({
      provider: 'unknown',
      model: 'iportal-ai',
      promptTokens: 0,
      completionTokens: 0,
      status: 'error',
      errorMessage: err.message,
    });
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
