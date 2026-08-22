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
      return ['groq', 'gemini', 'sambanova', 'cerebras', 'openrouter', 'mistral', 'cloudflare', 'huggingface'];
    }
    if (requestedModel === 'iportal-ai-fast') {
      return ['cerebras', 'groq', 'gemini', 'sambanova', 'openrouter'];
    }
    if (requestedModel === 'iportal-ai-reasoning') {
      return ['sambanova', 'groq', 'openrouter', 'cloudflare', 'gemini'];
    }
    if (requestedModel === 'iportal-ai-pro') {
      return ['gemini', 'groq', 'sambanova', 'openrouter', 'cerebras'];
    }
    if (requestedModel === 'iportal-ai-coder') {
      return ['sambanova', 'groq', 'openrouter', 'mistral', 'gemini'];
    }

    // Default fallback order with primary first
    const allProviders: ProviderId[] = ['groq', 'gemini', 'sambanova', 'cerebras', 'openrouter', 'mistral', 'cloudflare', 'huggingface'];
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

    throw new Error(
      'Neyrotizim ayni damda yuqori yuklama ostida. Iltimos, birozdan so\'ng qayta urinib ko\'ring.'
    );
  }
}

export const masterRouter = new MasterRouter();
