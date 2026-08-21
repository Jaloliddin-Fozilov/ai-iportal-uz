import { AIModelMeta } from './types';

export const IPORTAL_MODELS: AIModelMeta[] = [
  {
    id: 'iportal-ai',
    name: 'iportal-ai 1.0 (Flagship)',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'smart',
    description: 'Eng kuchli va keng qamrovli flagman model. Matn tahlili, savol-javob va umumiy vazifalar uchun.',
    contextWindow: 131072,
    speed: '~350 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-coder',
    name: 'iportal-ai Code Master',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'code',
    description: 'Dasturlash, arxitektura, xatolarni tuzatish va toza kod yozish uchun maxsus tayyorlangan model.',
    contextWindow: 131072,
    speed: '~300 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-reasoning',
    name: 'iportal-ai Logic & Math',
    provider: 'groq',
    realModelId: 'qwen/qwen3.6-27b',
    category: 'reasoning',
    description: 'Bosqichma-bosqich chuqur fikrlovchi, matematika, fan va mantiqiy xulosalar chiqaruvchi model.',
    contextWindow: 131072,
    speed: '~250 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-fast',
    name: 'iportal-ai Turbo',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-20b',
    category: 'fast',
    description: 'Ultra yuqori tezlikdagi tezkor javoblar (800+ tok/s). Qisqa savollar va kundalik yordamchi.',
    contextWindow: 131072,
    speed: '~800 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-pro',
    name: 'iportal-ai Pro (Deep Research)',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'smart',
    description: 'Katta hajmdagi hujjatlarni tahlil qilish, chuqur tadqiqot va ilmiy tahlillar uchun.',
    contextWindow: 131072,
    speed: '~320 tok/s',
    isFree: true,
  },
];

export function findModel(modelId: string): AIModelMeta {
  const found = IPORTAL_MODELS.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  if (found) return found;
  return IPORTAL_MODELS[0];
}
