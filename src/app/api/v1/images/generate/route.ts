import { NextRequest, NextResponse } from 'next/server';
import { synthesizeImagePrompt } from '@/lib/ai/imagePromptSynthesizer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { prompt, messages = [], width = 1024, height = 1024, seed } = body;

    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return NextResponse.json(
        { success: false, error: 'Prompt text is required.' },
        { status: 400 }
      );
    }

    const rawInput = prompt.trim();
    
    // Synthesize accurate English prompt preserving the exact subject
    const finalPrompt = await synthesizeImagePrompt(rawInput, messages);
    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // High resolution image pipeline with multi-model capability
    const rawCdnUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true&enhance=true`;
    const fallbackCdnUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=turbo&seed=${randomSeed}&nologo=true`;
    
    const proxyUrl = `/api/v1/images/proxy?prompt=${encodedPrompt}&url=${encodeURIComponent(rawCdnUrl)}&fallback=${encodeURIComponent(fallbackCdnUrl)}`;

    return NextResponse.json({
      success: true,
      imageUrl: proxyUrl,
      rawUrl: rawCdnUrl,
      fallbackUrl: fallbackCdnUrl,
      prompt: finalPrompt,
      originalPrompt: rawInput,
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
