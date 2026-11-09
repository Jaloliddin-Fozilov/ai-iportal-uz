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

/**
 * Normalizes Uzbek speech transcription:
 * Converts Arabic script (Southern Uzbek) or Kazakh misclassifications to pure contemporary Latin Uzbek.
 */
async function cleanUzbekTranscription(rawText: string, apiKey: string): Promise<string> {
  const trimmed = rawText.trim();
  if (!trimmed) return trimmed;

  // Check if text has Arabic script or Kazakh-specific letters / vocabulary
  const hasArabic = /[\u0600-\u06FF]/.test(trimmed);
  const hasKazakh = /[әғқңөұүһі]/i.test(trimmed) || /\b(жақсы|сәлем|болады|қалай|рахмет|жоқ|керек|істеп|барлық|бірақ|болып|дейін)\b/i.test(trimmed);

  if (!hasArabic && !hasKazakh) {
    return trimmed;
  }

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
            content: "Siz audio transkripsiyasini tozalovchi mutaxassissiz. Agar matnda arab yozuvi yoki qozoqcha imloga xos so'zlar bo'lsa, uni sof va toza adabiy O'zbek lotin tiliga o'giring. Ruscha yoki inglizcha so'zlarni o'zgartirmang. FAQAT tozalangan matnni qaytaring, hech qanday izoh qo'shmang."
          },
          {
            role: 'user',
            content: trimmed
          }
        ],
        temperature: 0.0,
        max_tokens: 300,
      }),
      signal: AbortSignal.timeout(6000),
    });

    if (res.ok) {
      const data = await res.json();
      const cleaned = data.choices?.[0]?.message?.content?.trim();
      if (cleaned) return cleaned;
    }
  } catch (e) {
    console.warn('[AudioService] Fast Uzbek cleaner skipped on timeout:', e);
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
        const cleanedText = await cleanUzbekTranscription(rawText, elevenKey.key);
        return {
          text: cleanedText,
          provider: 'elevenlabs',
          language,
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

  // 2. High-speed Failover: Groq Whisper Large-v3 (with Uzbek Latin prompt conditioning)
  const groqKey = LoadBalancer.selectKey('groq');
  const fallbackKey = groqKey?.key || process.env.GROQ_API_KEY || process.env.GROQ_API_KEYS?.split(',')[0] || '';

  try {
    const defaultPrompt = prompt || (language === 'uz' || !language
      ? "O'zbekiston, Toshkent, Samarqand, o'zbek tili, lotin yozuvi. Salom, assalomu alaykum, qandaysiz, yaxshimisiz, rahmat, nima gap, dastur, iportal."
      : undefined);

    const formData = new FormData();
    const blob = new Blob([uint8], { type: mimeType });
    formData.append('file', blob, filename);
    formData.append('model', 'whisper-large-v3');
    if (language && language !== 'auto') formData.append('language', language);
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
      const cleanedText = await cleanUzbekTranscription(rawText, fallbackKey);
      return {
        text: cleanedText,
        provider: 'groq',
        language,
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
