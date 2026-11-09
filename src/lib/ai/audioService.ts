import { LoadBalancer } from '../core/balancer';
import { CircuitBreaker } from '../core/circuitBreaker';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface TranscribeResult {
  text: string;
  provider: 'groq';
  language?: string;
  duration?: number;
}

export interface SpeechResult {
  audioBuffer: Buffer;
  contentType: string;
  provider: 'msedge';
  voice: string;
}

function getGroqApiKey(): string {
  const groqKey = LoadBalancer.selectKey('groq');
  return groqKey?.key || process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0] || '';
}

/**
 * Normalizes speech transcription:
 * - Refines phonetic slips and Whisper misspellings into pristine modern Uzbek Latin.
 * - Converts Arabic/Persian script artifacts from Whisper into clean Uzbek Latin.
 * - Preserves Russian, English, Kazakh, or other languages untouched.
 */
async function cleanTranscription(rawText: string): Promise<string> {
  const trimmed = rawText.trim();
  if (!trimmed) return trimmed;

  const apiKey = getGroqApiKey();
  if (!apiKey) return trimmed;

  try {
    const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen/qwen3.8-27b',
        messages: [
          {
            role: 'system',
            content: "Siz audio transkripsiyasini aniq adabiy matnga aylantiruvchi mutaxassissiz.\n" +
              "Qat'iy qoidalar:\n" +
              "1. ASLO yangi so'z to'qimang yoki ma'noni o'zgartirmang! Barcha aytilgan so'zlarni to'liq saqlang.\n" +
              "2. Whisper tomonidan qilingan fonetik xatolarni adabiy O'zbek lotin imlosiga to'g'rilang (masalan: 'treni rufke' -> 'trenirovka', 'yi girma minu' -> 'yigirma minut', 'chay' -> 'choy' (aslo cho'y emas, 'choy'), 'soattan' -> 'soatdan', 'mengi' -> 'menga', 'bayche' -> 'bo\\'yicha', 'xawa' -> 'havo', 'kuyashli' -> 'quyoshli').\n" +
              "3. Agar matn rus, ingliz yoki boshqa tilda bo'lsa, o'zgarishsiz qoldiring.\n" +
              "4. FAQAT yakuniy to'g'rilangan toza matnni qaytaring, boshqa hech narsa yozmang."
          },
          {
            role: 'user',
            content: trimmed
          }
        ],
        temperature: 0.0,
        max_tokens: 400,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const cleaned = data.choices?.[0]?.message?.content?.trim();
      if (cleaned) return cleaned;
    }
  } catch (e) {
    console.warn('[AudioService] Fast transcription cleaner skipped:', e);
  }

  return trimmed;
}

/**
 * Speech-to-Text (STT) Audio Transcription Engine
 * Powered by Groq Whisper Large-v3 with Latin Uzbek Priming & Qwen Refinement
 * 100% Free, Unlimited, Ultra-Fast (~300ms)
 */
export async function transcribeAudio(params: {
  buffer: Buffer;
  filename?: string;
  mimeType?: string;
  language?: string;
  prompt?: string;
}): Promise<TranscribeResult> {
  const { buffer, filename = 'audio.mp3', mimeType = 'audio/mpeg', language, prompt } = params;
  const uint8 = new Uint8Array(buffer);

  const groqKey = LoadBalancer.selectKey('groq');
  const fallbackKey = groqKey?.key || process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0] || '';

  try {
    const targetLang = language && language !== 'auto' ? language : 'uz';
    const defaultPrompt = prompt || "O'zbekiston Respublikasi, Toshkent shahri. Assalomu alaykum, ertaga soat sakkizda uyg'onib, trenirovka qilib, dasturlash bo'yicha ishga ketaman. Здравствуйте, как дела? Hello, how are you today?";

    const formData = new FormData();
    const blob = new Blob([uint8], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-large-v3');
    formData.append('language', targetLang);
    if (defaultPrompt) formData.append('prompt', defaultPrompt);

    const res = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fallbackKey}`,
      },
      body: formData,
      signal: AbortSignal.timeout(30000),
    });

    if (res.ok) {
      const data = await res.json();
      if (groqKey) CircuitBreaker.recordKeySuccess(groqKey);
      const rawText = (data.text || '').trim();
      const cleanedText = await cleanTranscription(rawText);
      return {
        text: cleanedText,
        provider: 'groq',
        language: targetLang,
      };
    }

    const errText = await res.text().catch(() => '');
    throw new Error(`STT transkripsiya xatosi (HTTP ${res.status}): ${errText}`);
  } catch (err: any) {
    if (groqKey) CircuitBreaker.recordKeyFailure(groqKey, 500, err.message);
    throw new Error(`Audio transkripsiyasida xatolik: ${err.message}`);
  }
}

/**
 * Text-to-Speech (TTS) Voice Synthesis Engine
 * Powered by Microsoft Edge Neural HD Voice Studio (Madina & Sardor)
 * 100% Free, Unlimited, Human-like Natural Voice
 */
export async function generateSpeech(params: {
  text: string;
  voice?: string;
  speed?: number;
  model?: string;
}): Promise<SpeechResult> {
  const { text, voice = 'uz-female', speed = 1.0 } = params;
  const cleanText = text.trim();
  if (!cleanText) {
    throw new Error('Matn bo\'sh bo\'lishi mumkin emas.');
  }

  const lowerVoice = voice.toLowerCase();
  const isMale = lowerVoice.includes('male') || lowerVoice.includes('sardor') || lowerVoice.includes('onyx') || lowerVoice.includes('echo');
  const isRussian = lowerVoice.includes('ru') || lowerVoice.includes('svetlana');
  const isEnglish = lowerVoice.includes('en') || lowerVoice.includes('jenny');

  let edgeVoice = isMale ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
  if (isRussian) edgeVoice = 'ru-RU-SvetlanaNeural';
  if (isEnglish) edgeVoice = 'en-US-JennyNeural';

  try {
    const tts = new MsEdgeTTS();
    await tts.setMetadata(edgeVoice, OUTPUT_FORMAT.AUDIO_24KHZ_48KBITRATE_MONO_MP3);
    const { audioStream } = await tts.toStream(cleanText);

    const chunks: Buffer[] = [];
    audioStream.on('data', (chunk: Buffer) => chunks.push(chunk));

    const audioBuffer = await new Promise<Buffer>((resolve, reject) => {
      audioStream.on('end', () => resolve(Buffer.concat(chunks)));
      audioStream.on('error', (err: any) => reject(err));
    });

    return {
      audioBuffer,
      contentType: 'audio/mpeg',
      provider: 'msedge',
      voice: edgeVoice,
    };
  } catch (err: any) {
    throw new Error(`Ovoz generatsiyasida xatolik yuz berdi: ${err.message}`);
  }
}
