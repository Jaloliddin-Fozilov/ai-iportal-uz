'use client';

import React from 'react';
import { X, BookOpen, ExternalLink, ShieldCheck, Zap, Server, Globe } from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d121f] border border-[#232f48] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">ai.iportal.uz — To'liq Qo'llanma</h2>
              <p className="text-xs text-gray-400">Bepul AI kalitlar olish, bepul hostinglarni ulash va API integratsiyasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2336] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-sm text-gray-300 leading-relaxed">
          {/* Section 1: Free AI Providers */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>1. Bepul AI API Kalitlarini Olish (0$ Budjet)</span>
            </div>

            <p className="text-xs text-gray-400">
              Quyidagi har bir provayderda bepul ro'yxatdan o'tib, API kalit yaratib oling va saytdagi "Hosting & AI Klaster" oynasiga kiriting:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
              {/* Groq */}
              <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Groq Cloud (Llama 3.3 70B)</span>
                  <a
                    href="https://console.groq.com/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <span>console.groq.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  Llama 3.3 70B va Gemma 2 modellarini 300+ token/sekund tezlikda bepul beradi.
                </p>
              </div>

              {/* Google AI Studio */}
              <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Google Gemini (AI Studio)</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <span>aistudio.google.com</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  Gemini 2.0 Flash va 1.5 Flash modellarini 1M kontekst bilan kunlik 1500 ta so'rovgacha tekinga beradi.
                </p>
              </div>

              {/* SambaNova */}
              <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">SambaNova Cloud</span>
                  <a
                    href="https://cloud.sambanova.ai/apis"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <span>cloud.sambanova.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  DeepSeek R1 70B va Qwen 2.5 Coder modellarini yuqori RPM limitlari bilan bepul taqdim etadi.
                </p>
              </div>

              {/* Cerebras */}
              <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Cerebras Inference</span>
                  <a
                    href="https://cloud.cerebras.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <span>cloud.cerebras.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  Dunyoning eng tezkor AI inferensi (1000+ token/s) — Llama 3.1 8B va 70B bepul tier.
                </p>
              </div>

              {/* OpenRouter */}
              <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">OpenRouter Free Tier</span>
                  <a
                    href="https://openrouter.ai/keys"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <span>openrouter.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  DeepSeek R1, Llama 3.3, Gemma kabi o'nlab bepul (<code>:free</code>) modellarga kirish.
                </p>
              </div>

              {/* Mistral AI */}
              <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">Mistral AI Console</span>
                  <a
                    href="https://console.mistral.ai"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1 text-[11px] text-blue-400 hover:underline"
                  >
                    <span>console.mistral.ai</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <p className="text-[11px] text-gray-400">
                  Mistral Small, Codestral kabi modellar uchun bepul eksperiment kalitlari.
                </p>
              </div>
            </div>
          </div>

          {/* Section 2: Distributed Hosting Proxies */}
          <div className="space-y-3 pt-4 border-t border-[#1e293f]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Server className="w-4 h-4 text-cyan-400" />
              <span>2. Bepul Hosting Node-Proxylarini Ishga Tushirish</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-2 text-xs text-gray-300">
              <p>
                Loyiha papkasidagi <code>workers/</code> papkasida tayyor shablonlar mavjud:
              </p>
              <ul className="list-disc pl-5 space-y-1 text-gray-400">
                <li>
                  <strong className="text-white">Cloudflare Worker:</strong> <code>workers/cloudflare/index.js</code> faylini <a href="https://dash.cloudflare.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Cloudflare Workers</a> ga joylang (Kunlik 100,000 so'rov bepul!).
                </li>
                <li>
                  <strong className="text-white">Deno Deploy:</strong> <code>workers/deno/server.ts</code> ni <a href="https://dash.deno.com" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Deno Deploy</a> ga joylang.
                </li>
                <li>
                  <strong className="text-white">Vercel Edge:</strong> <code>workers/vercel/</code> papkasini Vercel ga bepul deploy qiling.
                </li>
                <li>
                  <strong className="text-white">Render / Koyeb:</strong> <code>workers/docker/</code> papkasini Render yoki Koyeb ga Docker Web Service sifatida tekinga joylang.
                </li>
              </ul>
              <p className="text-[11px] text-cyan-300 pt-1">
                Har bir joylangan workerning URL manzilini saytdagi "Hosting & AI Klaster" bo'limida "Node Qo'shish" tugmasi orqali kiriting.
              </p>
            </div>
          </div>

          {/* Section 3: Domain ai.iportal.uz */}
          <div className="space-y-3 pt-4 border-t border-[#1e293f]">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Globe className="w-4 h-4 text-emerald-400" />
              <span>3. ai.iportal.uz Domenini Bepul Ulash</span>
            </div>

            <div className="p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] space-y-2 text-xs text-gray-300">
              <ol className="list-decimal pl-5 space-y-1 text-gray-400">
                <li>Ushbu loyihani Vercel yoki Cloudflare Pages ga 1 klikda deploy qiling.</li>
                <li>Vercel Settings &gt; Domains bo'limiga o'ting va <code>ai.iportal.uz</code> domenini qo'shing.</li>
                <li><code>iportal.uz</code> DNS sozlamalariga (masalan Cloudflare yoki domeningiz boshqaruv panelida) CNAME yozuvi kiriting:
                  <div className="my-1.5 p-2 bg-[#090d16] font-mono text-cyan-300 rounded border border-[#1a2336]">
                    Type: CNAME | Name: ai | Target: cname.vercel-dns.com
                  </div>
                </li>
                <li>Sayt avtomatik SSL sertifikat bilan <code>https://ai.iportal.uz</code> manzilida ishga tushadi.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
