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
 * Powered by Groq Whisper Large-v3 with Smart Auto-Detection & Uzbek Precision Pipeline
 * 100% Free, Unlimited, Multi-Lingual (Russian, English, Uzbek, Kazakh, etc.)
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
    // If caller explicitly passed a language (e.g. 'ru', 'en', 'uz', 'kk')
    if (language && language !== 'auto') {
      const formData = new FormData();
      const blob = new Blob([uint8], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', language);
      if (prompt) formData.append('prompt', prompt);

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
        const cleanedText = language === 'uz' ? await cleanTranscription(rawText) : rawText;
        return {
          text: cleanedText,
          provider: 'groq',
          language,
        };
      }
    }

    // Step 1: Automatic Language Detection pass with verbose_json
    const autoFd = new FormData();
    const blob = new Blob([uint8], { type: mimeType });
    autoFd.append('file', blob, filename);
    autoFd.append('model', 'whisper-large-v3');
    autoFd.append('response_format', 'verbose_json');

    const resAuto = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${fallbackKey}`,
      },
      body: autoFd,
      signal: AbortSignal.timeout(30000),
    });

    if (resAuto.ok) {
      const dataAuto = await resAuto.json();
      if (groqKey) CircuitBreaker.recordKeySuccess(groqKey);
      const detectedLang = (dataAuto.language || '').toLowerCase();
      let rawText = (dataAuto.text || '').trim();

      const hasArabic = /[\u0600-\u06FF]/.test(rawText);
      const isCleanMajor = 
        (detectedLang === 'russian' || detectedLang === 'english' || detectedLang === 'german' || detectedLang === 'french' || detectedLang === 'spanish' || detectedLang === 'italian') &&
        !hasArabic;

      // Russian, English and clean major languages are returned directly without hallucination
      if (isCleanMajor && rawText) {
        return {
          text: rawText,
          provider: 'groq',
          language: detectedLang,
        };
      }

      // Step 2: For Central Asian speech (where Whisper misclassifies Uzbek as Persian/Azerbaijani/Kazakh/Uzbek), run targeted Uzbek pass
      const uzFd = new FormData();
      uzFd.append('file', new Blob([uint8], { type: mimeType }), filename);
      uzFd.append('model', 'whisper-large-v3');
      uzFd.append('language', 'uz');
      uzFd.append('prompt', "O'zbekiston Respublikasi Toshkent shahri. Salom, ertaga soat sakkizda uyg'onib ishga ketishim kerak.");

      const resUz = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${fallbackKey}`,
        },
        body: uzFd,
        signal: AbortSignal.timeout(30000),
      });

      if (resUz.ok) {
        const dataUz = await resUz.json();
        rawText = (dataUz.text || '').trim() || rawText;
      }

      // Step 3: Polish Uzbek phonetic slips with Qwen
      const cleanedText = await cleanTranscription(rawText);
      return {
        text: cleanedText,
        provider: 'groq',
        language: detectedLang || 'uz',
      };
    }

    const errText = await resAuto.text().catch(() => '');
    throw new Error(`STT transkripsiya xatosi (HTTP ${resAuto.status}): ${errText}`);
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
