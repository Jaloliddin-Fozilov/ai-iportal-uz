import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  try {
    const { prompt, width = 1024, height = 1024, model = 'flux', seed } = await req.json();

    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Prompt kiritilishi shart.' },
        { status: 400 }
      );
    }

    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(prompt.trim());
    
    // High-resolution Flux / SDXL generation via Pollinations Edge
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=${model}&seed=${randomSeed}&nologo=true&enhance=true`;

    return NextResponse.json({
      success: true,
      imageUrl,
      prompt: prompt.trim(),
      seed: randomSeed,
      width,
      height,
      model,
      created: Date.now(),
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || 'Rasm generatsiyasida xatolik' },
      { status: 500 }
    );
  }
}
