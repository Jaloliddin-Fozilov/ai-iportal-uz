import { NextRequest, NextResponse } from 'next/server';
import { masterRouter } from '@/lib/core/router';

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
    let finalPrompt = rawInput;
    let wasModifiedFromContext = false;

    // Use LLM to accurately translate non-English prompts (Uzbek, Russian, etc.)
    // and synthesize context if editing an existing scene, strictly preserving the user's subject!
    try {
      const hasHistory = Array.isArray(messages) && messages.length > 0;
      const historyContext = hasHistory
        ? messages.slice(-4).map((m: any) => `${m.role === 'user' ? 'User' : 'Scene'}: ${typeof m.content === 'string' ? m.content.replace(/!\[.*?\]\(.*?\)/g, '').slice(0, 200) : ''}`).join('\n')
        : '';

      const promptSynthesizerPayload = [
        {
          role: 'system' as const,
          content: `You are an expert AI prompt engineer.
Your task:
1. Translate the user's request into clear, detailed English image prompt.
2. STRICTLY preserve the user's exact subject (e.g. if they say car/mashina, output a car; if they say nature/tabiat, output nature; if animal/hayvon, output that animal; if cyber/tech, output cyber/tech). NEVER substitute the subject with a girl, person, or portrait unless the user explicitly requested a girl or woman.
3. If the user is modifying a previous scene (e.g., "now red", "add rain", "orqa fonga tog' qo'sh"), incorporate the previous scene elements with the new change.
4. Output ONLY the English prompt text. No explanations, no quotes.`,
        },
        {
          role: 'user' as const,
          content: hasHistory 
            ? `Previous Conversation Context:\n${historyContext}\n\nUser's latest request: "${rawInput}"\n\nGenerate the complete standalone English prompt:`
            : `User prompt: "${rawInput}". Output detailed English prompt:`,
        },
      ];

      const result = await masterRouter.executeChat({
        model: 'iportal-ai-fast',
        messages: promptSynthesizerPayload,
        temperature: 0.2,
        max_tokens: 150,
      });

      if (result && result.response) {
        const synthesized = result.response.choices?.[0]?.message?.content?.trim();
        if (synthesized && synthesized.length > 4) {
          finalPrompt = synthesized.replace(/^["']|["']$/g, '').trim();
          if (hasHistory && (rawInput.length < 20 || rawInput.includes('endi') || rawInput.includes('now') || rawInput.includes('add') || rawInput.includes('qo\'sh'))) {
            wasModifiedFromContext = true;
          }
        }
      }
    } catch (synthErr) {
      console.warn('[ImageGenerate] Prompt expansion skipped, using direct input:', synthErr);
      finalPrompt = rawInput;
    }

    const randomSeed = seed || Math.floor(Math.random() * 1000000);
    const encodedPrompt = encodeURIComponent(finalPrompt);
    
    // Generate high resolution image via neural diffusion pipeline
    const rawCdnUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&model=flux&seed=${randomSeed}&nologo=true&enhance=true`;
    const proxyUrl = `/api/v1/images/proxy?url=${encodeURIComponent(rawCdnUrl)}`;

    return NextResponse.json({
      success: true,
      imageUrl: proxyUrl,
      rawUrl: rawCdnUrl,
      prompt: finalPrompt,
      originalPrompt: rawInput,
      wasModifiedFromContext,
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
