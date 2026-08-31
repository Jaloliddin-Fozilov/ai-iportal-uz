'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  X, 
  BookOpen, 
  Copy, 
  Check, 
  Terminal, 
  Code2, 
  Cpu, 
  ShieldCheck, 
  Globe, 
  ExternalLink,
  Zap,
  Play,
  Laptop
} from 'lucide-react';

interface DocsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const DocsModal: React.FC<DocsModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'curl' | 'python' | 'node' | 'cursor'>('curl');
  const [copied, setCopied] = useState<string | null>(null);

  if (!isOpen) return null;

  const copySnippet = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(id);
      setTimeout(() => setCopied(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const curlExample = `curl https://ai.iportal.uz/api/v1/chat/completions \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "iportal-ai",
    "messages": [
      {"role": "user", "content": "Hello! How do I build a scalable microservice?"}
    ],
    "stream": false
  }'`;

  const pythonExample = `import openai

client = openai.OpenAI(
    api_key="<YOUR_API_KEY>",
    base_url="https://ai.iportal.uz/api/v1"
)

response = client.chat.completions.create(
    model="iportal-ai",  # or "iportal-ai-deepseek", "iportal-ai-cerebras"
    messages=[
        {"role": "user", "content": "Explain async architectures in Python."}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)`;

  const nodeExample = `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "<YOUR_API_KEY>",
  baseURL: "https://ai.iportal.uz/api/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "iportal-ai-coder",
    messages: [{ role: "user", content: "Write a React 19 custom hook." }],
    stream: true,
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();`;

  const cursorExample = `{
  "models": [
    {
      "name": "iportal 1.0 Flagship",
      "model": "iportal-ai",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    },
    {
      "name": "iportal DeepSeek R1",
      "model": "iportal-ai-deepseek",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  iportal-ai API Hujjatlari
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  OpenAI Compatible
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Rasmiy API integratsiya qo'llanmasi va kod namunalari
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/docs"
              onClick={onClose}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
            >
              <span>To'liq Portal</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </Link>

            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          {/* Top Info Banner */}
          <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <span className="text-xs font-extrabold text-emerald-900 flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-emerald-600" />
                OpenAI SDK Bilan 100% Mos
              </span>
              <p className="text-[11px] text-emerald-700">
                Faqat <code className="font-mono bg-white px-1.5 py-0.5 rounded border border-emerald-200 font-bold">baseURL: &quot;https://ai.iportal.uz/api/v1&quot;</code> ni o'zgartirish kifoya.
              </p>
            </div>

            <Link
              href="/docs"
              onClick={onClose}
              className="px-3.5 py-2 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5 shrink-0"
            >
              <Play className="w-3 h-3 fill-current" />
              <span>Interaktiv Playground</span>
            </Link>
          </div>

          {/* Code Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5 p-1 rounded-xl bg-slate-100">
                {(['curl', 'python', 'node', 'cursor'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      activeTab === tab 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'node' ? 'Node.js' : tab === 'cursor' ? 'Cursor IDE' : tab.toUpperCase()}
                  </button>
                ))}
              </div>

              <span className="text-[11px] font-mono text-slate-400">POST /api/v1/chat/completions</span>
            </div>

            {/* Code Display */}
            <div className="relative rounded-2xl bg-slate-950 border border-slate-800 overflow-hidden shadow-xl">
              <button
                onClick={() => {
                  const map = { curl: curlExample, python: pythonExample, node: nodeExample, cursor: cursorExample };
                  copySnippet(map[activeTab], activeTab);
                }}
                className="absolute top-3 right-3 flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors z-10 cursor-pointer"
              >
                {copied === activeTab ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === activeTab ? 'Nusxalandi' : 'Nusxalash'}</span>
              </button>

              <pre className="p-4 sm:p-5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed pt-10 sm:pt-5">
                {activeTab === 'curl' && curlExample}
                {activeTab === 'python' && pythonExample}
                {activeTab === 'node' && nodeExample}
                {activeTab === 'cursor' && cursorExample}
              </pre>
            </div>
          </div>

          {/* Model Catalog Table */}
          <div className="space-y-2.5">
            <h3 className="font-bold text-xs text-slate-900 uppercase tracking-wider">
              Asosiy Model Identifikatorlari
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-slate-900">iportal-ai</span>
                  <span className="text-[10px] text-emerald-600 font-bold">Llama 3.3 70B</span>
                </div>
                <p className="text-[11px] text-slate-500">Universal suhbat va murakkab tahlil uchun asosiy flagman.</p>
              </div>

              <div className="p-3 rounded-xl bg-purple-50/50 border border-purple-200 space-y-1">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-purple-900">iportal-ai-deepseek</span>
                  <span className="text-[10px] text-purple-700 font-bold">DeepSeek R1</span>
                </div>
                <p className="text-[11px] text-slate-500">Qadam-baqadam mantiqiy fikrlash (reasoning) va matematika.</p>
              </div>

              <div className="p-3 rounded-xl bg-amber-50/50 border border-amber-200 space-y-1">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-amber-900">iportal-ai-cerebras</span>
                  <span className="text-[10px] text-amber-700 font-bold">1000 tok/s</span>
                </div>
                <p className="text-[11px] text-slate-500">Cerebras wafer chipida ultra-tezkor real-vaqtli generatsiya.</p>
              </div>

              <div className="p-3 rounded-xl bg-pink-50/50 border border-pink-200 space-y-1">
                <div className="flex items-center justify-between font-mono text-xs">
                  <span className="font-bold text-pink-900">iportal-image</span>
                  <span className="text-[10px] text-pink-700 font-bold">FLUX.1 Schnell</span>
                </div>
                <p className="text-[11px] text-slate-500">Cloudflare GPU orqali 1.5s da fotorealistik rasm yaratish.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-100 bg-[#f8faf9] flex items-center justify-between text-xs text-slate-500">
          <span>Global Anycast Edge Network • 99.9% Uptime</span>
          <Link
            href="/docs"
            onClick={onClose}
            className="font-bold text-emerald-700 hover:underline flex items-center gap-1"
          >
            <span>Barcha Qo'llanmalar (/docs)</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>
    </div>
  );
};
