import { LoadBalancer } from '../core/balancer';
import { CircuitBreaker } from '../core/circuitBreaker';
import { MsEdgeTTS, OUTPUT_FORMAT } from 'msedge-tts';

export interface TranscribeResult {
  text: string;
  provider: 'elevenlabs' | 'groq';
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

function getElevenLabsApiKeys(): string[] {
  const fromEnv = process.env.ELEVENLABS_API_KEYS || process.env.ELEVENLABS_API_KEY || '';
  const list = fromEnv
    .split(',')
    .map((k) => k.trim().replace(/['"]/g, ''))
    .filter(Boolean);
  const fromBalancer = LoadBalancer.selectKey('elevenlabs')?.key;
  if (fromBalancer && !list.includes(fromBalancer)) {
    list.unshift(fromBalancer);
  }
  return list;
}

/**
 * Normalizes speech transcription:
 * - Refines phonetic slips and Whisper misspellings into pristine modern Uzbek Latin.
 * - Converts Arabic/Persian script artifacts from Whisper into clean Uzbek Latin.
 * - Preserves Russian, English, Kazakh, or other languages untouched.
 * - Strictly forbids changing user vocabulary or substituting synonyms.
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
            content: "Siz audio transkripsiyasidagi imlo va fonetik xatolarni to'g'rilovchi tahrirchisiz.\n" +
              "Qat'iy qoidalar:\n" +
              "1. FOYDALANUVCHI AYTGAN SO'ZLARNI ASLO BOSHQA SO'ZGA YOKI SINONIMIGA ALMASHTIRMANG!\n" +
              "   - Masalan: 'treni rufke' yoki 'trenirovka' aytilgan bo'lsa, 'trenirovka' deb qolsin, 'mashg'ulot' qilmang!\n" +
              "   - 'minu' yoki 'minut' aytilgan bo'lsa, 'minut' deb qolsin, 'daqiqa' qilmang!\n" +
              "   - So'zlarni tarjima qilmang, yangi so'z qo'shmang va mavjud so'zlarni olib tashlamang.\n" +
              "2. Har bir tilni (o'zbek, rus, ingliz) o'z alifbosida saqlang:\n" +
              "   - Ruscha so'zlarni rus kirill alifbosida ('Привет, как дела', 'Потом я соберусь купить машину').\n" +
              "   - Inglizcha so'zlarni ingliz tilida ('I need to buy a milk and a car').\n" +
              "   - O'zbekcha so'zlarni zamonaviy o'zbek lotin imlosida ('Ertaga soat 8:00 da uyg\\'onib...').\n" +
              "3. Faqat fonetik xatolarni adabiy imloga to'g'rilang (masalan: 'soattan' / 'saatdən' -> 'soatdan', 'chay' -> 'choy', 'mengi' -> 'menga', 'uyqanıb' -> 'uyg\\'onib', 'kuyashli' -> 'quyoshli').\n" +
              "4. Javob sifatida FAQAT to'g'rilangan yakuniy matnni qaytaring, ortiqcha izoh yozmang."
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
 * Powered by Groq Whisper Large-v3 with Multilingual Code-Switching & Uzbek Precision Pipeline
 * 100% Free, Unlimited, Multi-Lingual (Uzbek, Russian, English, Kazakh, etc.)
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

  // Tier 1: ElevenLabs Scribe v1 Engine (State-of-the-art native Uzbek, Russian, English & code-switching)
  const elevenKeys = getElevenLabsApiKeys();
  for (const elevenKey of elevenKeys) {
    try {
      const elevenFd = new FormData();
      const blob = new Blob([uint8], { type: mimeType });
      elevenFd.append('file', blob, filename);
      elevenFd.append('model_id', 'scribe_v1');
      if (language && language !== 'auto' && language !== 'multilingual') {
        elevenFd.append('language_code', language);
      }

      const resEleven = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey,
        },
        body: elevenFd,
        signal: AbortSignal.timeout(20000),
      });

      if (resEleven.ok) {
        const dataEleven = await resEleven.json();
        const scribeText = (dataEleven.text || '').trim();
        if (scribeText) {
          return {
            text: scribeText,
            provider: 'elevenlabs',
            language: dataEleven.language_code || 'auto',
          };
        }
      } else {
        const errBody = await resEleven.text().catch(() => '');
        console.warn(`[AudioService] ElevenLabs key ...${elevenKey.slice(-6)} returned status ${resEleven.status}:`, errBody);
      }
    } catch (scribeErr: any) {
      console.warn('[AudioService] ElevenLabs Scribe failed, trying next key or fallback:', scribeErr?.message);
    }
  }

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

    const MULTILINGUAL_WHISPER_PROMPT =
      "Multilingual mixed speech in English, Russian, Uzbek: I need, привет, как дела, va undan keyin soat sakkizda ishga ketaman.";

    // Step 1: Automatic Language Detection pass with code-switching seed prompt
    const autoFd = new FormData();
    const blob = new Blob([uint8], { type: mimeType });
    autoFd.append('file', blob, filename);
    autoFd.append('model', 'whisper-large-v3');
    autoFd.append('response_format', 'verbose_json');
    autoFd.append('prompt', MULTILINGUAL_WHISPER_PROMPT);

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
      const hasCyrillic = /[а-яё]/i.test(rawText);
      const hasLatin = /[a-z]/i.test(rawText);
      const isMixed = hasCyrillic && hasLatin;
      const isPureRussian = (detectedLang === 'russian' || hasCyrillic) && !hasLatin && !hasArabic;
      const isPureEnglish = (detectedLang === 'english' || detectedLang === 'german' || detectedLang === 'french') && hasLatin && !hasCyrillic && !hasArabic;

      // Pure Russian or English is returned directly without hallucination
      if (isPureRussian && rawText) {
        return {
          text: rawText,
          provider: 'groq',
          language: 'ru',
        };
      }
      if (isPureEnglish && rawText) {
        return {
          text: rawText,
          provider: 'groq',
          language: detectedLang || 'en',
        };
      }

      // Step 2: For pure Uzbek or regional speech (or if Arabic script artifacts appeared), run targeted Uzbek pass
      if (!isMixed && (hasArabic || (detectedLang !== 'russian' && detectedLang !== 'english'))) {
        const uzFd = new FormData();
        uzFd.append('file', new Blob([uint8], { type: mimeType }), filename);
        uzFd.append('model', 'whisper-large-v3');
        uzFd.append('language', 'uz');
        uzFd.append('prompt', "O'zbekiston Respublikasi Toshkent shahri. Ertaga soat 8:00 da uyg'onib, yarim soat trenirovka qilib, 20 minut choy ichib, bir soatdan ishga ketishim kerak.");

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
          if (dataUz.text && dataUz.text.trim()) {
            rawText = dataUz.text.trim();
          }
        }
      }

      // Step 3: Polish Uzbek or mixed speech with strict non-substituting cleaner
      const cleanedText = await cleanTranscription(rawText);
      return {
        text: cleanedText,
        provider: 'groq',
        language: isMixed ? 'mixed' : 'uz',
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
