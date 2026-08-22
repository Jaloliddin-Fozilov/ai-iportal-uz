import { AIModelMeta } from './types';

export const IPORTAL_MODELS: AIModelMeta[] = [
  {
    id: 'iportal-ai',
    name: 'iportal-ai 1.0 (Flagship)',
    provider: 'groq',
    realModelId: 'openai/gpt-oss-120b',
    category: 'smart',
    description: 'Flagship neural model for all-round intelligence, deep analysis, and general tasks.',
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
    description: 'Specialized for software engineering, system architecture, refactoring, and debugging.',
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
    description: 'Step-by-step chain-of-thought model for complex mathematics, logic, and scientific analysis.',
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
    description: 'Ultra high-speed responses (800+ tok/s). Best for quick answers and lightweight assistance.',
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
    description: 'Deep research engine for long-document synthesis, detailed reporting, and thorough reviews.',
    contextWindow: 131072,
    speed: '~320 tok/s',
    isFree: true,
  },
  {
    id: 'image-flux',
    name: 'iportal Image Studio (Flux 8K)',
    provider: 'huggingface',
    realModelId: 'flux-1-schnell',
    category: 'general',
    description: 'Text-to-Image creation model powered by Flux 8K AI. Generates ultra high-res visuals in chat.',
    contextWindow: 4096,
    speed: '~3 sec/img',
    isFree: true,
  },
];

export function findModel(modelId: string): AIModelMeta {
  const found = IPORTAL_MODELS.find(m => m.id.toLowerCase() === modelId.toLowerCase());
  if (found) return found;
  return IPORTAL_MODELS[0];
}
