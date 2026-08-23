import { masterRouter } from '../core/router';

// Instant dictionary for Uzbek/Russian visual keywords to guarantee 100% subject preservation
const UZ_RU_VISUAL_MAP: Record<string, string> = {
  // Transport & Vehicles
  'mashina': 'a sleek luxury modern sports car, aerodynamic design, glowing headlights, metallic finish',
  'avtomobil': 'a modern luxury automobile, premium automotive photography, studio lighting',
  'sport mashina': 'an aggressive high-performance hypercar, aerodynamic bodywork, carbon fiber details, racing livery',
  'kiberpank mashina': 'a futuristic cyberpunk vehicle, neon cyan and magenta underglow, sci-fi concept car',
  'samolyot': 'a modern high-tech supersonic jet aircraft flying through dramatic sky',
  'vertolyot': 'a modern helicopter hovering over a scenic landscape',
  'kema': 'a magnificent large ship sailing on deep blue ocean waves',
  'kater': 'a fast luxury speedboat slicing through turquoise waters',
  'velosiped': 'a sleek modern bicycle, titanium frame, urban street background',
  'motosikl': 'a high-power custom motorcycle, chrome and matte black finish',

  // Nature & Landscapes
  'tabiat': 'a breathtaking lush green nature landscape, pristine forest, sun rays filtering through trees',
  'tog': 'majestic snow-capped mountain peaks, alpine valley, dramatic clouds, golden hour sunlight',
  'toglar': 'a grand mountain range with snow peaks and pine forests, cinematic 8k landscape',
  'dengiz': 'a crystal-clear turquoise ocean with rolling waves crashing against coastal cliffs',
  'okean': 'deep blue infinite ocean, sunset reflection on water surface',
  'sharshara': 'a magnificent cascading waterfall surrounded by tropical green foliage',
  'quyosh botishi': 'a stunning golden sunset with vibrant orange and purple sky over horizon',
  'quyosh chiqishi': 'an inspiring sunrise with morning mist over a peaceful lake',
  'daryo': 'a winding clear river flowing through a lush mountain valley',
  'sahro': 'golden sand dunes in vast desert, undulating wind patterns, warm sunlight',
  'oromgoh': 'a cozy wooden cabin retreat nestled in a misty pine forest',
  'kosmos': 'a deep space cosmos view with colorful nebula, glowing stars, and distant galaxies',
  'koinot': 'a vast celestial universe, orbiting planets, glowing cosmic dust and nebula clouds',
  'oy': 'a massive glowing full moon with detailed craters in a dark starry night sky',

  // Architecture & Cities
  'shahar': 'a futuristic metropolis skyline with towering glass skyscrapers and illuminated bridges',
  'kiberpank': 'a neon-drenched cyberpunk city at rainy night, holographic billboards, flying traffic',
  'bino': 'award-winning modern architectural masterpiece building, glass facade and clean lines',
  'uy': 'a luxurious modern glass villa with infinity pool and architectural landscape',
  'qasr': 'a majestic fantasy castle on top of a mountain with stone towers and banners',
  'toshkent': 'Tashkent modern cityscape with illuminated landmark architecture and beautiful sky',
  'samarqand': 'Registan square in Samarkand, intricate Islamic turquoise mosaic tile architecture',
  'buxoro': 'ancient Bukhara historic architecture, Poi Kalyan minaret, warm desert sand brickwork',

  // Animals & Flora
  'sher': 'a majestic male lion with a full golden mane, powerful noble expression',
  'yoʻlbars': 'a fierce royal Bengal tiger walking through jungle, striking orange stripes',
  'yolbars': 'a fierce royal Bengal tiger walking through jungle, striking orange stripes',
  'ot': 'a powerful black Arabian stallion running galloping through open field, wind in mane',
  'burgut': 'a majestic golden eagle soaring high above mountains, wings spread wide',
  'boʻri': 'a lone noble wolf with silver fur standing on a rocky cliff under moonlight',
  'bori': 'a lone noble wolf with silver fur standing on a rocky cliff under moonlight',
  'mushuk': 'a beautiful fluffy kitten with bright expressive eyes, soft fur, close-up portrait',
  'kuchuk': 'a friendly handsome golden retriever dog in a green park with sunlight',
  'it': 'a noble loyal dog with expressive eyes and glossy coat',
  'daraxt': 'an ancient giant fantasy tree with glowing leaves and twisted roots, magical atmosphere',
  'gul': 'vibrant blooming exotic flowers with delicate dew drops, macro photography',
  'atirgul': 'a deep red velvety rose with sparkling water droplets, soft bokeh background',

  // Tech & Objects
  'robot': 'a sophisticated humanoid robot with polished white and carbon armor, glowing blue optics',
  'krasovka': 'a limited-edition futuristic concept sneaker, intricate sole textures, neon accents',
  'telefon': 'a next-gen ultra-thin concept smartphone with holographic bezel-less display',
  'soat': 'a luxury Swiss mechanical watch with open tourbillon movement, sapphire crystal',
  'noutbuk': 'a sleek ultra-slim futuristic laptop with illuminated mechanical keyboard',
  'kamera': 'a vintage professional camera with brass accents and precision glass lens',
};

export async function synthesizeImagePrompt(rawInput: string, conversationHistory: any[] = []): Promise<string> {
  const inputLower = rawInput.toLowerCase().trim();

  // If input is a meta question (e.g. "nega faqat kimdir...", "nima uchun...", "bu nima?"), convert to art concept
  if (inputLower.startsWith('nega') || inputLower.startsWith('nima') || inputLower.startsWith('why') || inputLower.startsWith('pochemu')) {
    return 'a futuristic glowing quantum core floating in a dark high-tech cybernetic laboratory, volumetric lighting, 8k resolution, cinematic sci-fi render';
  }

  // 1. Try LLM Prompt Synthesizer
  try {
    const hasHistory = Array.isArray(conversationHistory) && conversationHistory.length > 0;
    const historyContext = hasHistory
      ? conversationHistory.slice(-4).map((m: any) => `${m.role === 'user' ? 'User' : 'Scene'}: ${typeof m.content === 'string' ? m.content.replace(/!\[.*?\]\(.*?\)/g, '').slice(0, 150) : ''}`).join('\n')
      : '';

    const systemPrompt = `You are an elite visual prompt engineer for Flux and SDXL image generators.
Rules:
1. Translate the user's prompt (which may be in Uzbek, Russian, or English) into an accurate, highly detailed English visual prompt.
2. CRITICAL: Strictly preserve the exact subject matter:
   - If the user asks for a car (mashina), output a car.
   - If the user asks for nature (tabiat/tog'), output a mountain/nature landscape.
   - If the user asks for an animal, output that animal.
   - If the user asks for technology/cyber, output sci-fi tech.
   - NEVER add a human, woman, or girl unless the user explicitly requested a human/woman/person.
3. Enhance with professional photographic terms: 8k resolution, photorealistic, cinematic lighting, highly detailed, octane render, sharp focus.
4. Output ONLY the English prompt. No conversational filler, no quotes.`;

    const userPrompt = hasHistory
      ? `Previous Scene Context:\n${historyContext}\n\nUser's request: "${rawInput}"\n\nGenerate accurate standalone English prompt:`
      : `User prompt: "${rawInput}". Output detailed English prompt:`;

    const result = await masterRouter.executeChat({
      model: 'iportal-ai-fast',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      temperature: 0.2,
      max_tokens: 150,
      stream: false,
    });

    if (result && result.response) {
      const synthesized = result.response.choices?.[0]?.message?.content?.trim();
      if (synthesized && synthesized.length > 10) {
        // Strip any wrapping quotes
        return synthesized.replace(/^["']|["']$/g, '').trim();
      }
    }
  } catch (err) {
    console.warn('[PromptSynthesizer] LLM synthesis skipped, using visual dictionary fallback:', err);
  }

  // 2. Intelligent Keyword Dictionary Fallback (Whole words only)
  for (const [key, visualDescription] of Object.entries(UZ_RU_VISUAL_MAP)) {
    const wordRegex = new RegExp(`(^|\\s|[.,!?;])${key}($|\\s|[.,!?;])`, 'i');
    if (wordRegex.test(inputLower)) {
      return `${visualDescription}, 8k resolution, photorealistic, cinematic studio lighting, highly detailed, masterpiece`;
    }
  }

  // 3. Clean Fallback with Photographic Quality Enhancement
  const sanitized = rawInput
    .replace(/[^\w\s\-,.]/g, '')
    .trim();

  return `${sanitized || 'breathtaking landscape'}, photorealistic, 8k resolution, cinematic lighting, sharp focus, masterpiece`;
}
