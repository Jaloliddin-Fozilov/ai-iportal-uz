'use client';

import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, Terminal, Code, Cpu, ShieldCheck } from 'lucide-react';

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
  -H "Authorization: Bearer <SIZNING_API_KALITINGIZ>" \\
  -H "Content-Type: application/json" \\
  -d '{
    "model": "iportal-ai",
    "messages": [
      {"role": "user", "content": "Salom! iportal-ai API orqali javob beryapsanmi?"}
    ],
    "stream": false
  }'`;

  const pythonExample = `import openai

client = openai.OpenAI(
    api_key="<SIZNING_API_KALITINGIZ>",
    base_url="https://ai.iportal.uz/api/v1"
)

response = client.chat.completions.create(
    model="iportal-ai",
    messages=[
        {"role": "user", "content": "FastAPI va PostgreSQL bilan arxitektura tuzib ber"}
    ],
    temperature=0.7
)

print(response.choices[0].message.content)`;

  const nodeExample = `import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: "<SIZNING_API_KALITINGIZ>",
  baseURL: "https://ai.iportal.uz/api/v1",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "iportal-ai-coder",
    messages: [{ role: "user", content: "React 19 uchun custom hook yozib ber" }],
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
      "name": "iportal-ai 1.0",
      "model": "iportal-ai",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<SIZNING_API_KALITINGIZ>"
    },
    {
      "name": "iportal-ai Code Master",
      "model": "iportal-ai-coder",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<SIZNING_API_KALITINGIZ>"
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0c101c] border border-[#1b253b] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#162035] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600/20 to-cyan-500/20 border border-blue-500/30 text-cyan-400">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight">iportal-ai API & Integratsiya Qo'llanmasi</h2>
              <p className="text-xs text-slate-400">OpenAI SDK bilan 100% mos keluvchi neyron API</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#141b2b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-300 leading-relaxed">
          {/* Quick specs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 rounded-xl bg-[#090d16] border border-[#162035] space-y-1">
              <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-[11px]">
                <Terminal className="w-3.5 h-3.5" />
                <span>Base URL:</span>
              </div>
              <div className="font-mono text-slate-200 text-[11px] select-all">https://ai.iportal.uz/api/v1</div>
            </div>

            <div className="p-3 rounded-xl bg-[#090d16] border border-[#162035] space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Moslik:</span>
              </div>
              <div className="text-slate-200 text-[11px]">OpenAI v1 API Spec (Chat & Streaming)</div>
            </div>

            <div className="p-3 rounded-xl bg-[#090d16] border border-[#162035] space-y-1">
              <div className="flex items-center gap-1.5 text-purple-400 font-semibold text-[11px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>Standart Model:</span>
              </div>
              <div className="font-mono text-slate-200 text-[11px]">iportal-ai</div>
            </div>
          </div>

          {/* Code Integration Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1 bg-[#090d16] p-1 rounded-xl border border-[#162035]">
                <button
                  onClick={() => setActiveTab('curl')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'curl' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  cURL
                </button>
                <button
                  onClick={() => setActiveTab('python')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'python' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Python
                </button>
                <button
                  onClick={() => setActiveTab('node')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'node' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Node.js / TS
                </button>
                <button
                  onClick={() => setActiveTab('cursor')}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    activeTab === 'cursor' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  Cursor / VS Code
                </button>
              </div>

              <button
                onClick={() => {
                  const text = activeTab === 'curl' ? curlExample : activeTab === 'python' ? pythonExample : activeTab === 'node' ? nodeExample : cursorExample;
                  copySnippet(text, 'code');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#12192a] hover:bg-[#19243d] border border-[#1f2b45] text-slate-300 transition-colors cursor-pointer"
              >
                {copied === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'code' ? 'Nusxalandi' : 'Kodni Nusxalash'}</span>
              </button>
            </div>

            <div className="p-4 rounded-xl bg-[#070a12] border border-[#162035] overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-200 shadow-inner">
              <pre className="whitespace-pre">
                {activeTab === 'curl' && curlExample}
                {activeTab === 'python' && pythonExample}
                {activeTab === 'node' && nodeExample}
                {activeTab === 'cursor' && cursorExample}
              </pre>
            </div>
          </div>

          {/* Available Models Overview */}
          <div className="space-y-2 pt-2 border-t border-[#162035]">
            <h3 className="font-bold text-white text-xs uppercase tracking-wider">Mavjud Modellar:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#162035]">
                <div className="font-bold font-mono text-cyan-400">iportal-ai</div>
                <div className="text-slate-400">Asosiy universal flagman model. 128K kontekst.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#162035]">
                <div className="font-bold font-mono text-emerald-400">iportal-ai-coder</div>
                <div className="text-slate-400">Kod yozish, refaktoring va dasturlash uchun maxsus.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#162035]">
                <div className="font-bold font-mono text-purple-400">iportal-ai-reasoning</div>
                <div className="text-slate-400">Bosqichma-bosqich mantiqiy xulosalar va tahlil.</div>
              </div>
              <div className="p-2.5 rounded-lg bg-[#090d16] border border-[#162035]">
                <div className="font-bold font-mono text-amber-400">iportal-ai-fast</div>
                <div className="text-slate-400">Ultra tezkor javoblar (800+ tok/s).</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
