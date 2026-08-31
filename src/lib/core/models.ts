import { AIModelMeta } from './types';

export const IPORTAL_MODELS: AIModelMeta[] = [
  {
    id: 'iportal-ai',
    name: 'iportal 1.0 (Flagship)',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'smart',
    description: 'iportal universal flagman neyron modeli. Murakkab tahlil, muloqot va barcha vazifalar uchun asosiy yadro.',
    contextWindow: 131072,
    speed: '~350 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-reasoning',
    name: 'iportal Reasoning (Neural Logic)',
    provider: 'groq',
    realModelId: 'qwen/qwen3.6-27b',
    category: 'reasoning',
    description: 'Qadam-baqadam mantiqiy fikrlash, matematika, algoritmik tahlil va chuqur xulosalar chiqarish modeli.',
    contextWindow: 131072,
    speed: '~250 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-coder',
    name: 'iportal Code Master',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'code',
    description: 'Dasturiy arxitektura, to\'liq kod sintezi, refaktoring va dasturlash muammolarini yechish modeli.',
    contextWindow: 131072,
    speed: '~300 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-fast',
    name: 'iportal Turbo (Ultra-Fast)',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-20b',
    category: 'fast',
    description: 'Sub-soniyali ultra yuqori tezlikdagi neyron yadro (1000 tok/s). Tezkor savol-javoblar uchun eng qulay.',
    contextWindow: 131072,
    speed: '1000 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-ai-pro',
    name: 'iportal Pro (Deep Research)',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'smart',
    description: 'Kengaytirilgan chuqur tadqiqot, katta hajmli hujjatlar sintezi va professional hisobotlar modeli.',
    contextWindow: 131072,
    speed: '~320 tok/s',
    isFree: true,
  },
  {
    id: 'iportal-image',
    name: 'iportal Image Studio',
    provider: 'huggingface',
    realModelId: 'flux-1-schnell',
    category: 'general',
    description: 'Fotorealistik 8k neyron tasvir generatsiyasi dvigateli. 1.5 soniyada yuqori aniqlikdagi rasmlar yaratadi.',
    contextWindow: 4096,
    speed: '~1.5 sec/img',
    isFree: true,
  },
];

export function findModel(modelId: string): AIModelMeta {
  const normalized = modelId.toLowerCase();
  if (normalized === 'image-flux' || normalized === 'flux' || normalized === 'iportal-image') {
    return IPORTAL_MODELS.find(m => m.id === 'iportal-image') || IPORTAL_MODELS[0];
  }
  if (normalized === 'iportal-ai-deepseek' || normalized === 'iportal-reasoning') {
    return IPORTAL_MODELS.find(m => m.id === 'iportal-ai-reasoning') || IPORTAL_MODELS[0];
  }
  if (normalized === 'iportal-ai-cerebras' || normalized === 'iportal-turbo') {
    return IPORTAL_MODELS.find(m => m.id === 'iportal-ai-fast') || IPORTAL_MODELS[0];
  }
  const found = IPORTAL_MODELS.find(m => m.id.toLowerCase() === normalized);
  if (found) return found;
  return IPORTAL_MODELS[0];
}
