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

    let finalPrompt = prompt.trim();
    let wasModifiedFromContext = false;

    // If previous conversation context exists (image iteration/editing), synthesize the prompt
    if (Array.isArray(messages) && messages.length > 0) {
      try {
        const lastFewMessages = messages.slice(-6);
        const promptSynthesizerPayload = [
          {
            role: 'system' as const,
            content: `You are an expert AI image prompt synthesizer. The user is in a chat conversation iteratively generating and modifying images.
Analyze the conversation history and the user's latest modification instruction.
Synthesize a single, detailed, standalone image prompt in English that combines previous visual elements with the newly requested edits/changes.
Output ONLY the resulting prompt string. Do not include quotes, explanations, or conversational filler.`,
          },
          ...lastFewMessages.map((m: any) => ({
            role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
            // Clean markdown images from past assistant messages to keep only textual prompts
            content: typeof m.content === 'string' ? m.content.replace(/!\[.*?\]\(.*?\)/g, '').trim() : '',
          })),
          {
            role: 'user' as const,
            content: `Latest modification/request: "${finalPrompt}". Output the updated complete image prompt in English:`,
          },
        ];

        const result = await masterRouter.executeChat({
          model: 'iportal-ai-fast',
          messages: promptSynthesizerPayload,
          temperature: 0.3,
          max_tokens: 200,
        });

        if (result && result.response) {
          const synthesized = result.response.choices?.[0]?.message?.content?.trim();
          if (synthesized && synthesized.length > 5) {
            finalPrompt = synthesized.replace(/^["']|["']$/g, '');
            wasModifiedFromContext = true;
          }
        }
      } catch (synthErr) {
        console.warn('[ImageGenerate] Context prompt synthesis skipped, using direct prompt:', synthErr);
      }
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
      originalPrompt: prompt.trim(),
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
