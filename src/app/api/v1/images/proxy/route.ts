import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const imageUrl = searchParams.get('url');
    const fallbackUrl = searchParams.get('fallback');

    const promptParam = searchParams.get('prompt');

    if (!imageUrl && !promptParam) {
      return new NextResponse('Missing image url or prompt', { status: 400 });
    }

    const decodedUrl = imageUrl ? decodeURIComponent(imageUrl) : '';
    let imageBuffer: ArrayBuffer | null = null;
    let contentType = 'image/jpeg';

    const cfAccountId = process.env.CLOUDFLARE_ACCOUNT_ID;
    const cfToken = process.env.CLOUDFLARE_API_TOKEN;

    // 0. Primary High-Speed Cloudflare Workers AI Flux-1-Schnell Pipeline (<2s latency)
    if (cfAccountId && cfToken) {
      try {
        const promptMatch = decodedUrl.match(/\/prompt\/([^?]+)/);
        const promptText = promptParam ? decodeURIComponent(promptParam) : (promptMatch ? decodeURIComponent(promptMatch[1]) : '');
        if (promptText) {
          const cfRes = await fetch(
            `https://api.cloudflare.com/client/v4/accounts/${cfAccountId}/ai/run/@cf/black-forest-labs/flux-1-schnell`,
            {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${cfToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ prompt: promptText }),
              signal: AbortSignal.timeout(28000),
            }
          );

          if (cfRes.ok) {
            const cfData = await cfRes.json().catch(() => ({}));
            if (cfData.result?.image) {
              const base64Str = cfData.result.image;
              imageBuffer = Buffer.from(base64Str, 'base64').buffer;
              contentType = 'image/jpeg';
            }
          }
        }
      } catch (cfErr) {
        console.warn('[ImageProxy] Cloudflare Flux generation failed, falling back to CDN:', cfErr);
      }
    }

    // 1. Fallback High-Res Pipeline (if Cloudflare not available or failed)
    if (!imageBuffer) {
      try {
        const response = await fetch(decodedUrl, {
          headers: {
            'User-Agent': 'iportal-image-engine/1.0',
          },
          signal: AbortSignal.timeout(20000),
        });

        if (response.ok) {
          imageBuffer = await response.arrayBuffer();
          contentType = response.headers.get('content-type') || 'image/jpeg';
        }
      } catch (primaryErr) {
        console.warn('[ImageProxy] Secondary image fetch timed out or failed, attempting high-speed fallback:', primaryErr);
      }
    }

    // 2. Try High-Speed Fallback Pipeline (Turbo model - 1.5s rendering)
    if (!imageBuffer && fallbackUrl) {
      try {
        const decodedFallback = decodeURIComponent(fallbackUrl);
        const fbResponse = await fetch(decodedFallback, {
          headers: {
            'User-Agent': 'iportal-image-engine/1.0',
          },
          signal: AbortSignal.timeout(15000),
        });

        if (fbResponse.ok) {
          imageBuffer = await fbResponse.arrayBuffer();
          contentType = fbResponse.headers.get('content-type') || 'image/jpeg';
        }
      } catch (fbErr) {
        console.error('[ImageProxy] Fallback also failed:', fbErr);
      }
    }

    // 3. Fallback: Ultra-fast direct turbo prompt URL if still empty
    if (!imageBuffer) {
      try {
        const promptMatch = decodedUrl.match(/\/prompt\/([^?]+)/);
        const promptText = promptMatch ? promptMatch[1] : 'abstract-artwork';
        const emergencyUrl = `https://image.pollinations.ai/prompt/${promptText}?model=turbo&width=1024&height=1024&nologo=true`;
        
        const emergResponse = await fetch(emergencyUrl, {
          headers: { 'User-Agent': 'iportal-image-engine/1.0' },
          signal: AbortSignal.timeout(12000),
        });

        if (emergResponse.ok) {
          imageBuffer = await emergResponse.arrayBuffer();
          contentType = emergResponse.headers.get('content-type') || 'image/jpeg';
        }
      } catch (_) {}
    }

    if (imageBuffer) {
      return new NextResponse(imageBuffer, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=31536000, immutable',
          'Access-Control-Allow-Origin': '*',
        },
      });
    }

    // 4. Return an elegant SVG placeholder if external CDNs are totally unreachable
    const svgFallback = `
      <svg width="1024" height="1024" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#0b101d"/>
            <stop offset="50%" stop-color="#121b2d"/>
            <stop offset="100%" stop-color="#070c16"/>
          </linearGradient>
        </defs>
        <rect width="1024" height="1024" fill="url(#g)"/>
        <circle cx="512" cy="460" r="80" fill="#00d68f" opacity="0.15"/>
        <text x="512" y="475" fill="#00d68f" font-size="48" font-family="sans-serif" text-anchor="middle" font-weight="bold">iportal AI</text>
        <text x="512" y="550" fill="#94a3b8" font-size="20" font-family="sans-serif" text-anchor="middle">Tasvir qayta render qilinmoqda, iltimos yangilang</text>
      </svg>
    `;

    return new NextResponse(svgFallback, {
      status: 200,
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'no-cache',
      },
    });
  } catch (err: any) {
    return new NextResponse(err.message || 'Image proxy error', { status: 500 });
  }
}
