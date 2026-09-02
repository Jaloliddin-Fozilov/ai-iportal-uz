import { ChatCompletionRequest, ProviderId } from './types';
import { BaseProvider, ProviderResponse } from '../providers/base';
import { GroqProvider } from '../providers/groq';
import { GeminiProvider } from '../providers/gemini';
import { SambaNovaProvider } from '../providers/sambanova';
import { CerebrasProvider } from '../providers/cerebras';
import { OpenRouterProvider } from '../providers/openrouter';
import { MistralProvider } from '../providers/mistral';
import { CloudflareAIProvider } from '../providers/cloudflare-ai';
import { HuggingFaceProvider } from '../providers/huggingface';
import { LoadBalancer } from './balancer';
import { findModel } from './models';

class MasterRouter {
  private providers = new Map<ProviderId, BaseProvider>();

  constructor() {
    this.register(new GroqProvider());
    this.register(new GeminiProvider());
    this.register(new SambaNovaProvider());
    this.register(new CerebrasProvider());
    this.register(new OpenRouterProvider());
    this.register(new MistralProvider());
    this.register(new CloudflareAIProvider());
    this.register(new HuggingFaceProvider());
  }

  private register(provider: BaseProvider) {
    this.providers.set(provider.id, provider);
  }

  getProvider(id: ProviderId): BaseProvider | undefined {
    return this.providers.get(id);
  }

  /**
   * Determine provider priority order based on requested model
   */
  getProviderPriority(requestedModel: string): ProviderId[] {
    const meta = findModel(requestedModel);
    const primary = meta.provider;

    if (requestedModel === 'iportal-ai' || requestedModel === 'default') {
      return ['groq', 'cloudflare', 'openrouter', 'gemini'];
    }
    if (requestedModel === 'iportal-ai-fast') {
      return ['groq', 'cloudflare', 'openrouter', 'cerebras'];
    }
    if (requestedModel === 'iportal-ai-reasoning') {
      return ['cloudflare', 'groq', 'openrouter'];
    }
    if (requestedModel === 'iportal-ai-pro') {
      return ['cloudflare', 'groq', 'openrouter'];
    }
    if (requestedModel === 'iportal-ai-coder') {
      return ['groq', 'cloudflare', 'openrouter'];
    }

    // Default fallback order with primary first
    const allProviders: ProviderId[] = ['groq', 'cloudflare', 'openrouter', 'gemini'];
    return [primary, ...allProviders.filter(p => p !== primary)];
  }

  /**
   * Execute chat completion with seamless failover across multiple keys and multiple free providers
   */
  async executeChat(request: ChatCompletionRequest): Promise<ProviderResponse> {
    const providerPriority = this.getProviderPriority(request.model || 'iportal-ai');
    const errors: string[] = [];

    for (const providerId of providerPriority) {
      const provider = this.providers.get(providerId);
      if (!provider) continue;

      // Try up to 2 different keys per provider before falling back to next provider
      for (let attempt = 0; attempt < 2; attempt++) {
        const keyItem = LoadBalancer.selectKey(providerId);
        if (!keyItem) {
          // No keys configured for this provider, skip to next provider
          break;
        }

        const node = LoadBalancer.selectNode();

        try {
          // console.log(`[Router] Attempting Provider: ${providerId} | Key: ${keyItem.maskedKey} | Node: ${node?.name || 'Direct'}`);
          const result = await provider.chat(request, keyItem, node);
          return result;
        } catch (err: any) {
          const errMsg = `[${providerId} key:${keyItem.maskedKey}] ${err.message}`;
          console.warn(`[Router Failover] ${errMsg}`);
          errors.push(errMsg);
          // Loop will retry with another key or next provider
        }
      }
    }

    console.error(`[MasterRouter Exhausted] All providers and keys failed:\n${errors.join('\n')}`);

    if (errors.some(e => e.includes('Request too large') || e.includes('tokens per minute') || e.includes('413') || e.includes('context_length') || e.includes('TPM'))) {
      throw new Error(
        'TOO_LONG: Matn yoki yuklangan fayl hajmi neyrotizimning bitta so\'rovdagi xotira limitidan (TPM) oshib ketdi. Iltimos, xabarni qisqartiring, yangi chat oching yoki faylsiz yuboring.'
      );
    }

    if (errors.some(e => e.includes('429') || e.includes('Rate limit') || e.includes('rate_limit_exceeded') || e.includes('RPM'))) {
      throw new Error(
        'RATE_LIMIT: Minutlik so\'rovlar chegarasiga yetildi. Bepul model 30-60 soniyada avtomatik qayta tiklanadi.'
      );
    }

    throw new Error(
      'HIGH_LOAD: Neyrotizim ayni damda yuqori yuklama ostida. Iltimos, birozdan so\'ng qayta urinib ko\'ring.'
    );
  }
}

export const masterRouter = new MasterRouter();
