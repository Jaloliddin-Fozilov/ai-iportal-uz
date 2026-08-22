import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, width = 1024, height = 1024, seed } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt text is required.' },
        { status: 400 }
      );
    }

    const cleanPrompt = prompt.trim();
    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(cleanPrompt);
    
    // Generate high resolution image via neural diffusion pipeline
    const rawCdnUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true&enhance=true`;
    const proxyUrl = `/api/v1/images/proxy?url=${encodeURIComponent(rawCdnUrl)}`;

    return NextResponse.json({
      success: true,
      imageUrl: proxyUrl,
      rawUrl: rawCdnUrl,
      prompt: cleanPrompt,
      seed: randomSeed,
      width,
      height,
      model: 'iportal-image',
      created: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Image generation error' },
      { status: 500 }
    );
  }
}
