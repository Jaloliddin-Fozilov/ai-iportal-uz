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
  provider: 'elevenlabs' | 'msedge';
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
            content: "Siz professional audio transkripsiyasini tozalovchi mutaxassissiz. Matndagi orfografik yoki fonetik xatolarni to'g'rilang. Hech qachon matnni qisqartirmang yoki so'zlarni tashlab ketmang. Barcha gaplarni to'liq saqlang.\n" +
              "- Agar matn o'zbek tiliga xos bo'lsa (yoki arab/fors/fonetik xato yozuvda bo'lsa), uni zamonaviy adabiy O'zbek lotin imlosiga to'liq va to'g'ri o'giring (masalan: 'Mengi' -> 'Menga', 'bitti' -> 'bitta', 'yazmakh' -> 'yozmoq', 'Azbekistan' -> 'O\\'zbekiston', 'khawajude' -> 'havo juda', 'kalay' -> 'qalay', 'barmi' -> 'bormi').\n" +
              "- Agar matn rus, ingliz, qozoq yoki boshqa tilda bo'lsa, uni boshqa tilga tarjima qilmang, o'sha tilning to'g'ri imlosi bilan to'liq qaytaring.\n" +
              "- FAQAT to'g'rilangan yakuniy matnni qaytaring, hech qanday izoh yoki tushuntirish yozmang."
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
 * Primary: ElevenLabs Scribe STT
 * Automatic Failover: Groq Whisper Large-v3 Turbo (Ultra-Fast 300ms)
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

  // 1. Try ElevenLabs Scribe STT if an active key is available
  const elevenKey = LoadBalancer.selectKey('elevenlabs');
  if (elevenKey && CircuitBreaker.isKeyAvailable(elevenKey)) {
    try {
      const formData = new FormData();
      const blob = new Blob([uint8], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('model_id', 'scribe_v1');
      if (language) formData.append('language_code', language);
      if (prompt) formData.append('prompt', prompt);

      const res = await fetch('https://api.elevenlabs.io/v1/speech-to-text', {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey.key,
        },
        body: formData,
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const data = await res.json();
        CircuitBreaker.recordKeySuccess(elevenKey);
        const rawText = (data.text || '').trim();
        return {
          text: rawText,
          provider: 'elevenlabs',
          language: data.language_code || language,
        };
      }

      const errText = await res.text().catch(() => '');
      console.warn(`[AudioService] ElevenLabs STT returned ${res.status}: ${errText.slice(0, 150)}`);
      CircuitBreaker.recordKeyFailure(elevenKey, res.status, errText);
    } catch (err: any) {
      console.warn(`[AudioService] ElevenLabs STT network failure: ${err.message}`);
      CircuitBreaker.recordKeyFailure(elevenKey, 500, err.message);
    }
  }

  // 2. High-speed Failover: Groq Whisper Large-v3 with Intelligent Auto-Detection & Uzbek Latin Optimization
  const groqKey = LoadBalancer.selectKey('groq');
  const fallbackKey = groqKey?.key || process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0] || '';

  try {
    const defaultPrompt = prompt || "O'zbekiston, Toshkent, Samarqand, iportal, dastur, assalomu alaykum, qandaysiz, rahmat";

    // If caller explicitly passed a language (e.g. 'ru', 'en', 'uz', 'kk')
    if (language && language !== 'auto') {
      const formData = new FormData();
      const blob = new Blob([uint8], { type: mimeType });
      formData.append('file', blob, filename);
      formData.append('model', 'whisper-large-v3');
      formData.append('language', language);
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
          language,
        };
      }
    }

    // Auto-detection mode (Default): First pass with verbose_json
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
      const isPersianOrArabic = detectedLang === 'persian' || detectedLang === 'arabic' || detectedLang === 'urdu' || detectedLang === 'pashto';

      // If Whisper misclassified Uzbek as Persian/Arabic or produced empty text, run targeted Uzbek pass
      if (hasArabic || isPersianOrArabic || !rawText) {
        const uzFd = new FormData();
        uzFd.append('file', new Blob([uint8], { type: mimeType }), filename);
        uzFd.append('model', 'whisper-large-v3');
        uzFd.append('language', 'uz');
        uzFd.append('prompt', defaultPrompt);

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
      }

      // If text is clearly English, Russian, German, French, etc. without Central Asian scripts, return directly
      const isCleanMajorLang = 
        (detectedLang === 'english' || detectedLang === 'russian' || detectedLang === 'german' || detectedLang === 'french' || detectedLang === 'spanish' || detectedLang === 'chinese' || detectedLang === 'japanese') &&
        !hasArabic;

      if (isCleanMajorLang && rawText) {
        return {
          text: rawText,
          provider: 'groq',
          language: detectedLang,
        };
      }

      // For Central Asian languages (Uzbek, Kazakh, etc.) or post-Uzbek pass, polish with cleanTranscription
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
 * Primary: ElevenLabs Multilingual v2
 * Automatic Failover: Microsoft Edge Neural TTS (Madina / Sardor)
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

  // Map requested voice to Edge and ElevenLabs presets
  const lowerVoice = voice.toLowerCase();
  const isMale = lowerVoice.includes('male') || lowerVoice.includes('sardor') || lowerVoice.includes('onyx') || lowerVoice.includes('echo');
  const isRussian = lowerVoice.includes('ru') || lowerVoice.includes('svetlana');
  const isEnglish = lowerVoice.includes('en') || lowerVoice.includes('jenny');

  let edgeVoice = isMale ? 'uz-UZ-SardorNeural' : 'uz-UZ-MadinaNeural';
  if (isRussian) edgeVoice = 'ru-RU-SvetlanaNeural';
  if (isEnglish) edgeVoice = 'en-US-JennyNeural';

  // 1. Try ElevenLabs Multilingual v2 if active key available
  const elevenKey = LoadBalancer.selectKey('elevenlabs');
  if (elevenKey && CircuitBreaker.isKeyAvailable(elevenKey)) {
    try {
      const elevenVoiceId = isMale ? 'CwhRBWXzGAHq8TQ4Fs17' : 'EXAVITQu4vr4xnSDxMaL';
      const targetVoice = (voice.length > 15 && !voice.includes('-')) ? voice : elevenVoiceId;

      const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${targetVoice}`, {
        method: 'POST',
        headers: {
          'xi-api-key': elevenKey.key,
          'Content-Type': 'application/json',
          'Accept': 'audio/mpeg',
        },
        body: JSON.stringify({
          text: cleanText,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.5,
            similarity_boost: 0.75,
            speed: Math.max(0.7, Math.min(1.5, speed)),
          },
        }),
        signal: AbortSignal.timeout(30000),
      });

      if (res.ok) {
        const arrayBuf = await res.arrayBuffer();
        CircuitBreaker.recordKeySuccess(elevenKey);
        return {
          audioBuffer: Buffer.from(arrayBuf),
          contentType: 'audio/mpeg',
          provider: 'elevenlabs',
          voice: targetVoice,
        };
      }

      const errText = await res.text().catch(() => '');
      console.warn(`[AudioService] ElevenLabs TTS returned ${res.status}: ${errText.slice(0, 150)}`);
      CircuitBreaker.recordKeyFailure(elevenKey, res.status, errText);
    } catch (err: any) {
      console.warn(`[AudioService] ElevenLabs TTS failure: ${err.message}`);
      CircuitBreaker.recordKeyFailure(elevenKey, 500, err.message);
    }
  }

  // 2. High-quality Neural Fallback: Microsoft Edge Neural TTS
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
