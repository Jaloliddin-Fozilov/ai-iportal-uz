'use client';

import React, { useState } from 'react';
import { X, BookOpen, Copy, Check, Terminal, Code, Cpu, ShieldCheck, Globe } from 'lucide-react';

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
    model="iportal-ai",
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
      "name": "iportal-ai 1.0 (Flagship)",
      "model": "iportal-ai",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    },
    {
      "name": "iportal-ai Code Master",
      "model": "iportal-ai-coder",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    }
  ]
}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">API & Integration Documentation</h2>
              <p className="text-xs text-slate-500">100% OpenAI v1 SDK Compatible Neural Gateway</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700 leading-relaxed">
          {/* Quick specs grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-emerald-700 font-bold text-[11px]">
                <Terminal className="w-3.5 h-3.5" />
                <span>Base URL:</span>
              </div>
              <div className="font-mono text-slate-900 text-[11px] select-all font-semibold">https://ai.iportal.uz/api/v1</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-blue-700 font-bold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Compatibility:</span>
              </div>
              <div className="text-slate-800 text-[11px] font-medium">OpenAI v1 API Spec (Chat & Streaming)</div>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-1">
              <div className="flex items-center gap-1.5 text-purple-700 font-bold text-[11px]">
                <Cpu className="w-3.5 h-3.5" />
                <span>Default Model:</span>
              </div>
              <div className="font-mono text-slate-900 text-[11px] font-bold">iportal-ai</div>
            </div>
          </div>

          {/* Code Integration Tabs */}
          <div className="space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-full border border-slate-200">
                {(['curl', 'python', 'node', 'cursor'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                      activeTab === tab ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'curl' && 'cURL'}
                    {tab === 'python' && 'Python'}
                    {tab === 'node' && 'Node.js'}
                    {tab === 'cursor' && 'Cursor / VS Code'}
                  </button>
                ))}
              </div>

              <button
                onClick={() => {
                  const text = activeTab === 'curl' ? curlExample : activeTab === 'python' ? pythonExample : activeTab === 'node' ? nodeExample : cursorExample;
                  copySnippet(text, 'code');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-colors cursor-pointer border border-slate-200"
              >
                {copied === 'code' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied === 'code' ? 'Copied' : 'Copy Snippet'}</span>
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-[#0c121e] border border-slate-800 overflow-x-auto font-mono text-[12px] leading-relaxed text-slate-100 shadow-inner">
              <pre className="whitespace-pre">
                {activeTab === 'curl' && curlExample}
                {activeTab === 'python' && pythonExample}
                {activeTab === 'node' && nodeExample}
                {activeTab === 'cursor' && cursorExample}
              </pre>
            </div>
          </div>

          {/* Available Models Overview */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider">Available Neural Models:</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-[11px]">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold font-mono text-emerald-600">iportal-ai</div>
                <div className="text-slate-600">Flagship general-purpose intelligence (128K context).</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold font-mono text-blue-600">iportal-ai-coder</div>
                <div className="text-slate-600">Specialized for code synthesis and engineering.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold font-mono text-purple-600">iportal-ai-reasoning</div>
                <div className="text-slate-600">Chain-of-thought logic and mathematical proofs.</div>
              </div>
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="font-bold font-mono text-amber-600">iportal-ai-fast</div>
                <div className="text-slate-600">Ultra fast turbo model (800+ tokens/sec).</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
