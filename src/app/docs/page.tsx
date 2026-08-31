'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { 
  BookOpen, 
  Terminal, 
  Code2, 
  Cpu, 
  Key, 
  Copy, 
  Check, 
  ArrowLeft, 
  Sparkles, 
  ExternalLink, 
  Play, 
  Zap, 
  ShieldCheck, 
  Globe, 
  Search, 
  ChevronRight, 
  Layers, 
  Image as ImageIcon,
  CheckCircle2,
  AlertTriangle,
  FileCode,
  Laptop,
  Server,
  Database,
  Shield,
  HeartHandshake
} from 'lucide-react';
import { AIOrb } from '@/components/AIOrb';

export default function DocsPage() {
  const [activeSection, setActiveSection] = useState<'quickstart' | 'models' | 'safeguards' | 'chat' | 'images' | 'sdks' | 'cursor' | 'errors' | 'playground'>('quickstart');
  const [activeSdkTab, setActiveSdkTab] = useState<'curl' | 'python' | 'node' | 'nextjs' | 'go' | 'php'>('curl');
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedSnippet, setCopiedSnippet] = useState<string | null>(null);

  // Playground state
  const [playModel, setPlayModel] = useState('iportal-ai');
  const [playKey, setPlayKey] = useState('');
  const [playPrompt, setPlayPrompt] = useState('Salom iportal AI! Dasturchilarga qanday yordam bera olasiz?');
  const [playResponse, setPlayResponse] = useState('');
  const [playLoading, setPlayLoading] = useState(false);
  const [playLatency, setPlayLatency] = useState<number | null>(null);
  const [playStatus, setPlayStatus] = useState<number | null>(null);

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedSnippet(id);
      setTimeout(() => setCopiedSnippet(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestPlayground = async () => {
    setPlayLoading(true);
    setPlayResponse('');
    setPlayLatency(null);
    setPlayStatus(null);
    const startTime = Date.now();

    try {
      const apiKeyToUse = playKey.trim() || 'demo-key';
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKeyToUse}`,
        },
        body: JSON.stringify({
          model: playModel,
          messages: [{ role: 'user', content: playPrompt }],
          stream: true,
          temperature: 0.7,
        }),
      });

      setPlayStatus(res.status);
      setPlayLatency(Date.now() - startTime);

      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        setPlayResponse(JSON.stringify(errJson, null, 2));
        setPlayLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder('utf-8');
      let accumulated = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');
          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data:')) {
              const dataStr = trimmed.slice(5).trim();
              if (dataStr === '[DONE]') continue;
              try {
                const parsed = JSON.parse(dataStr);
                const delta = parsed.choices?.[0]?.delta?.content || parsed.choices?.[0]?.delta?.reasoning_content || '';
                accumulated += delta;
                setPlayResponse(accumulated);
              } catch (_) {}
            }
          }
        }
      }
    } catch (err: any) {
      setPlayResponse(`Error: ${err.message}`);
    } finally {
      setPlayLoading(false);
      setPlayLatency(Date.now() - startTime);
    }
  };

  const codeSnippets = {
    curl: `curl https://ai.iportal.uz/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -d '{
    "model": "iportal-ai",
    "messages": [
      {"role": "system", "content": "You are an expert software architect."},
      {"role": "user", "content": "How do I implement high-concurrency connection pooling in Go?"}
    ],
    "temperature": 0.7,
    "stream": false
  }'`,

    python: `from openai import OpenAI

# Initialize OpenAI client pointing directly to iportal-ai
client = OpenAI(
    base_url="https://ai.iportal.uz/api/v1",
    api_key="<YOUR_API_KEY>"
)

response = client.chat.completions.create(
    model="iportal-ai",  # or "iportal-ai-reasoning", "iportal-ai-coder", "iportal-ai-fast"
    messages=[
        {"role": "system", "content": "You are a senior full-stack AI engineer."},
        {"role": "user", "content": "Explain React 19 Server Actions vs API Routes with examples."}
    ],
    temperature=0.7,
    stream=True
)

for chunk in response:
    if chunk.choices[0].delta.content:
        print(chunk.choices[0].delta.content, end="", flush=True)`,

    node: `import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai.iportal.uz/api/v1",
  apiKey: process.env.IPORTAL_API_KEY || "<YOUR_API_KEY>",
});

async function main() {
  const stream = await client.chat.completions.create({
    model: "iportal-ai",
    messages: [
      { role: "system", content: "You are an expert TypeScript architect." },
      { role: "user", content: "Create an async rate-limiter using Redis token bucket." },
    ],
    stream: true,
  });

  for await (const chunk of stream) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();`,

    nextjs: `// app/api/chat/route.ts
import OpenAI from "openai";

const client = new OpenAI({
  baseURL: "https://ai.iportal.uz/api/v1",
  apiKey: process.env.IPORTAL_API_KEY,
});

export async function POST(req: Request) {
  const { messages } = await req.json();

  const response = await client.chat.completions.create({
    model: "iportal-ai",
    messages,
    stream: true,
  });

  // Stream directly back to client
  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of response) {
        controller.enqueue(new TextEncoder().encode(chunk.choices[0]?.delta?.content || ""));
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}`,

    go: `package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
)

func main() {
	url := "https://ai.iportal.uz/api/v1/chat/completions"
	apiKey := os.Getenv("IPORTAL_API_KEY")

	payload := map[string]interface{}{
		"model": "iportal-ai",
		"messages": []map[string]string{
			{"role": "user", "content": "Explain Goroutines and Channels in Go."},
		},
		"stream": false,
	}

	body, _ := json.Marshal(payload)
	req, _ := http.NewRequest("POST", url, bytes.NewBuffer(body))
	req.Header.Set("Content-Type", "application/json")
	req.Header.Set("Authorization", "Bearer "+apiKey)

	client := &http.Client{}
	resp, err := client.Do(req)
	if err != nil {
		panic(err)
	}
	defer resp.Body.Close()

	respBody, _ := io.ReadAll(resp.Body)
	fmt.Println(string(respBody))
}`,

    php: `<?php
// PHP cURL example for iportal-ai API
$ch = curl_init("https://ai.iportal.uz/api/v1/chat/completions");

$payload = [
    "model" => "iportal-ai",
    "messages" => [
        ["role" => "user", "content" => "How to optimize MySQL query performance in Laravel?"]
    ],
    "temperature" => 0.7,
    "stream" => false
];

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer <YOUR_API_KEY>"
]);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($payload));
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($ch);
curl_close($ch);

echo $response;
?>`,
  };

  const cursorSettings = `{
  "models": [
    {
      "name": "iportal 1.0 (Flagship Core)",
      "model": "iportal-ai",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    },
    {
      "name": "iportal Reasoning (Neural Logic)",
      "model": "iportal-ai-reasoning",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    },
    {
      "name": "iportal Turbo (Ultra-Fast 1000 tok/s)",
      "model": "iportal-ai-fast",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    },
    {
      "name": "iportal Code Master",
      "model": "iportal-ai-coder",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "<YOUR_API_KEY>"
    }
  ]
}`;

  const imageCurl = `curl https://ai.iportal.uz/api/v1/images/generate \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer <YOUR_API_KEY>" \\
  -d '{
    "prompt": "Samarqand Registon maydoni zamonaviy neon yoritgichlarda, 8k fotorealistik, yuqori aniqlik",
    "width": 1024,
    "height": 1024
  }'`;

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-[#e2ece7] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-2.5 p-1.5 -ml-1.5 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-xs font-bold hidden sm:inline">Chatinga Qaytish</span>
          </Link>

          <div className="h-5 w-px bg-slate-200" />

          <div className="flex items-center gap-2.5">
            <AIOrb size="sm" />
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm tracking-tight text-slate-900">iportal-ai Docs</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  v1.0 API
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                OpenAI-moslashuvchan REST & Streaming API Hujjatlari
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200"
          >
            <Key className="w-3.5 h-3.5 text-purple-600" />
            <span>Dashboard & Keys</span>
          </Link>

          <button
            onClick={() => setActiveSection('playground')}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-slate-950" />
            <span>Live Playground</span>
          </button>
        </div>
      </header>

      {/* Main Content Layout */}
      <div className="flex-1 max-w-7xl w-full mx-auto flex flex-col md:flex-row px-4 sm:px-8 py-6 gap-8">
        {/* Left Sidebar Navigation */}
        <aside className="w-full md:w-64 shrink-0 space-y-6">
          <div className="sticky top-20 space-y-4">
            {/* Search Box */}
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Hujjatlar bo'ylab qidirish..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs"
              />
            </div>

            {/* Navigation Groups */}
            <div className="space-y-1 text-xs font-semibold">
              <button
                onClick={() => setActiveSection('quickstart')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'quickstart' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Zap className={`w-4 h-4 ${activeSection === 'quickstart' ? 'text-[#00d68f]' : 'text-emerald-600'}`} />
                  <span>Tezkor Boshlash (Quickstart)</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('models')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'models' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Cpu className={`w-4 h-4 ${activeSection === 'models' ? 'text-[#00d68f]' : 'text-purple-600'}`} />
                  <span>Mavjud iportal AI Modellar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('safeguards')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'safeguards' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ShieldCheck className={`w-4 h-4 ${activeSection === 'safeguards' ? 'text-[#00d68f]' : 'text-emerald-600'}`} />
                  <span>Axloqiy Me'yorlar & Xavfsizlik</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('chat')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'chat' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Terminal className={`w-4 h-4 ${activeSection === 'chat' ? 'text-[#00d68f]' : 'text-cyan-600'}`} />
                  <span>Chat Completions API</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('images')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'images' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <ImageIcon className={`w-4 h-4 ${activeSection === 'images' ? 'text-[#00d68f]' : 'text-pink-600'}`} />
                  <span>Neural Image Generation</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('sdks')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'sdks' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Code2 className={`w-4 h-4 ${activeSection === 'sdks' ? 'text-[#00d68f]' : 'text-amber-600'}`} />
                  <span>SDK & Framework Integratsiyasi</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('cursor')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'cursor' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Laptop className={`w-4 h-4 ${activeSection === 'cursor' ? 'text-[#00d68f]' : 'text-blue-600'}`} />
                  <span>Cursor / VS Code Ulanishi</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('errors')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'errors' 
                    ? 'bg-slate-900 text-white font-bold shadow-sm' 
                    : 'text-slate-700 hover:bg-slate-200/60'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={`w-4 h-4 ${activeSection === 'errors' ? 'text-[#00d68f]' : 'text-rose-600'}`} />
                  <span>Xatolik Kodlari & Limitlar</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-60" />
              </button>

              <button
                onClick={() => setActiveSection('playground')}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-left transition-all cursor-pointer ${
                  activeSection === 'playground' 
                    ? 'bg-emerald-600 text-white font-bold shadow-sm' 
                    : 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Play className="w-4 h-4 fill-current" />
                  <span>Jonli Test Playground</span>
                </div>
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-white/20 uppercase font-mono font-bold">Live</span>
              </button>
            </div>

            {/* Base URL Box */}
            <div className="p-3.5 rounded-2xl bg-white border border-slate-200 space-y-1.5 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">API Base URL</span>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-[11px] text-slate-800">
                <span className="truncate select-all">https://ai.iportal.uz/api/v1</span>
                <button
                  onClick={() => copyToClipboard('https://ai.iportal.uz/api/v1', 'base-url')}
                  className="p-1 hover:text-emerald-600 cursor-pointer"
                  title="Nusxalash"
                >
                  {copiedSnippet === 'base-url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
              </div>
            </div>
          </div>
        </aside>

        {/* Right Documentation Body */}
        <main className="flex-1 min-w-0 space-y-8 pb-16">
          {/* SECTION: QUICKSTART */}
          {activeSection === 'quickstart' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <Zap className="w-3.5 h-3.5" />
                  <span>30 Soniyada Boshlash</span>
                </div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  iportal-ai API Hujjatlari & Integratsiya
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  iportal-ai to'liq <strong>OpenAI-moslashuvchan (OpenAI-compatible)</strong> yuqori tezlikdagi neyron API hisoblanadi. Siz mavjud OpenAI SDK, LangChain, Cursor, Next.js yoki to'g'ridan-to'g'ri REST so'rovlari orqali bir necha qatorda ulanishingiz mumkin.
                </p>
              </div>

              {/* 3 Step Onboarding */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    1
                  </div>
                  <h3 className="font-bold text-xs text-slate-900">API Kalitini Oling</h3>
                  <p className="text-[11px] text-slate-500">
                    Saytda ro'yxatdan o'ting va shaxsiy <code className="text-emerald-700 font-mono">ip-live-xxxx</code> API kalitingizni 1-klikda bepul yarating.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    2
                  </div>
                  <h3 className="font-bold text-xs text-slate-900">Base URL ni O'rnating</h3>
                  <p className="text-[11px] text-slate-500">
                    So'rovlaringizni <code className="text-emerald-700 font-mono">https://ai.iportal.uz/api/v1</code> endpointiga yo'naltiring.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-2">
                  <div className="w-7 h-7 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold text-xs">
                    3
                  </div>
                  <h3 className="font-bold text-xs text-slate-900">Neyron AI Quvvatidan Foydalaning</h3>
                  <p className="text-[11px] text-slate-500">
                    iportal xususiy modellari yordamida soniyasiga 1000 ta token tezligida barqaror va xavfsiz javob oling.
                  </p>
                </div>
              </div>

              {/* Quick cURL code block */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono font-semibold">
                    <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tezkor cURL So'rovi</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(codeSnippets.curl, 'quick-curl')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    {copiedSnippet === 'quick-curl' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'quick-curl' ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {codeSnippets.curl}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: MODELS */}
          {activeSection === 'models' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-800 text-xs font-bold">
                  <Cpu className="w-3.5 h-3.5" />
                  <span>iportal Neyron Klasteri</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Mavjud iportal AI Modellar Catalogi
                </h2>
                <p className="text-sm text-slate-600">
                  Platformamizda matn yaratish, dasturlash, mantiqiy xulosalar chiqarish (reasoning) va fotorealistik tasvir generatsiyasi uchun maxsus modellar mavjud.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Flagship */}
                <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-slate-900 text-white">
                      iportal-ai
                    </span>
                    <span className="text-[11px] font-bold text-emerald-600">Flagship Core</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">iportal 1.0 (Flagship Core)</h3>
                  <p className="text-xs text-slate-500">
                    Barcha umumiy vazifalar, murakkab tahlil, o'zbek/rus/ingliz tillarida suhbatlashish uchun asosiy universal model.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-100 text-[11px] font-mono text-slate-600">
                    <div>Kontekst: <strong>128k</strong></div>
                    <div>Tezlik: <strong>~350 tok/s</strong></div>
                    <div>Narxi: <strong className="text-emerald-600">Bepul</strong></div>
                  </div>
                </div>

                {/* Reasoning */}
                <div className="p-5 rounded-3xl bg-white border border-purple-200 bg-purple-50/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-purple-900 text-white">
                      iportal-ai-reasoning
                    </span>
                    <span className="text-[11px] font-bold text-purple-700">Neural Logic</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">iportal Reasoning (Neural Logic)</h3>
                  <p className="text-xs text-slate-500">
                    Matematika, algoritmik tahlil va qadam-baqadam mantiqiy fikrlash (Chain-of-Thought) modeli.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-purple-100 text-[11px] font-mono text-slate-600">
                    <div>Kontekst: <strong>128k</strong></div>
                    <div>Fikrlash: <strong>&lt;think&gt;</strong></div>
                    <div>Narxi: <strong className="text-emerald-600">Bepul</strong></div>
                  </div>
                </div>

                {/* Code Master */}
                <div className="p-5 rounded-3xl bg-white border border-cyan-200 bg-cyan-50/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-cyan-900 text-white">
                      iportal-ai-coder
                    </span>
                    <span className="text-[11px] font-bold text-cyan-700">Code Master</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">iportal Code Master</h3>
                  <p className="text-xs text-slate-500">
                    Dasturiy arxitektura, to'liq kod sintezi, refaktoring va dasturlash muammolarini hal qilishga mo'ljallangan yadro.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-cyan-100 text-[11px] font-mono text-slate-600">
                    <div>Kontekst: <strong>128k</strong></div>
                    <div>Tezlik: <strong>~300 tok/s</strong></div>
                    <div>Narxi: <strong className="text-emerald-600">Bepul</strong></div>
                  </div>
                </div>

                {/* Turbo Fast */}
                <div className="p-5 rounded-3xl bg-white border border-amber-200 bg-amber-50/20 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-amber-900 text-white">
                      iportal-ai-fast
                    </span>
                    <span className="text-[11px] font-bold text-amber-700">1000 tok/sek</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">iportal Turbo (Ultra-Fast)</h3>
                  <p className="text-xs text-slate-500">
                    Soniyaning ulushlarida (&lt;180ms) real-vaqtli javob beruvchi sub-soniyali ultra-tezkor neyron model.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-amber-100 text-[11px] font-mono text-slate-600">
                    <div>Kechikish: <strong>&lt;180ms</strong></div>
                    <div>Tezlik: <strong>1000 tok/s</strong></div>
                    <div>Narxi: <strong className="text-emerald-600">Bepul</strong></div>
                  </div>
                </div>

                {/* Flux Neural Image */}
                <div className="p-5 rounded-3xl bg-white border border-pink-200 bg-pink-50/20 shadow-sm space-y-3 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-pink-900 text-white">
                      iportal-image
                    </span>
                    <span className="text-[11px] font-bold text-pink-700">Vision Studio</span>
                  </div>
                  <h3 className="font-bold text-slate-900 text-sm">iportal Image Studio (Neural Vision)</h3>
                  <p className="text-xs text-slate-500">
                    O'zbek, rus va ingliz tillaridagi matnlarni 1.5 soniyada yuqori aniqlikdagi fotorealistik tasvirlarga aylantirib beruvchi neyron generator.
                  </p>
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-pink-100 text-[11px] font-mono text-slate-600">
                    <div>Format: <strong>1024x1024</strong></div>
                    <div>Tezlik: <strong>~1.5s</strong></div>
                    <div>Narxi: <strong className="text-emerald-600">Bepul</strong></div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: SAFEGUARDS & ETHICAL FRAMEWORK */}
          {activeSection === 'safeguards' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  <span>Milliy & Axloqiy Xavfsizlik Asosi</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Axloqiy Me'yorlar, Islomiy Qadriyatlar va Qonuniy Kafolat
                </h2>
                <p className="text-sm text-slate-600 leading-relaxed">
                  iportal-ai platformasi barcha neyron so'rovlarda (veb-chat hamda API kalitlar orqali yuborilgan barcha murojaatlarda) o'rnatilgan <strong>majburiy bazaviy axloqiy va qonuniy me'yorlar tizimi</strong> asosida ishlaydi.
                </p>
              </div>

              <div className="p-6 rounded-3xl bg-white border border-emerald-200 shadow-sm space-y-4">
                <h3 className="text-base font-bold text-emerald-950 flex items-center gap-2">
                  <HeartHandshake className="w-5 h-5 text-emerald-600" />
                  <span>Qat'iy Axloqiy va Diniy Tamoyillar:</span>
                </h3>

                <ul className="space-y-2.5 text-xs text-slate-700 leading-relaxed">
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Islom dini qadriyatlari:</strong> Tizim Islom dini axloqiy tamoyillari hamda O'zbekiston Respublikasi qonunlariga so'zsiz rioya qiladi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Taqiqlangan sohalar:</strong> Qimor o'yinlari, bukmekerlik, sudxo'rlik/ribo, firibgarlik, aldov, behayo va fahsh kontent, spirtli ichimliklar, giyohvandlik moddalari, odamlarga zarar yetkazish, o'z joniga qasd qilish, ekstremizm va zararli dasturlar bo'yicha HECH QANDAY yordam ko'rsatilmaydi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Xushmuomala rad javobi:</strong> Agar so'rov taqiqlangan mavzularga daxldor bo'lsa, tizim o'ta bosiq, xushmuomala va qat'iy ohangda rad javobini beradi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>O'zbek tiliga ehtirom:</strong> O'zbek tilidagi murojaatlarga toza, adabiy, ravon va to'liq imlo qoidalariga mos tilda javob beriladi.</span>
                  </li>
                  <li className="flex items-start gap-2.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Brend mustaqilligi:</strong> iportal-ai iportal.uz platformasining mustaqil sun'iy intellekti sifatida o'z nufuzini saqlaydi.</span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* SECTION: CHAT COMPLETIONS API */}
          {activeSection === 'chat' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-50 border border-cyan-200 text-cyan-800 text-xs font-bold">
                  <Terminal className="w-3.5 h-3.5" />
                  <span>REST & Streaming Endpoint</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  POST /api/v1/chat/completions
                </h2>
                <p className="text-sm text-slate-600">
                  OpenAI standarti bo'yicha matn va kod yaratuvchi asosiy API endpointi.
                </p>
              </div>

              {/* Request Parameters Table */}
              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">So'rov Parametrlari (Request Body)</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse font-mono">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px]">
                        <th className="py-2.5 px-3">Parametr</th>
                        <th className="py-2.5 px-3">Turi</th>
                        <th className="py-2.5 px-3">Majburiy?</th>
                        <th className="py-2.5 px-3 font-sans">Tavsifi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-sans">
                      <tr>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">model</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">string</td>
                        <td className="py-3 px-3"><span className="text-rose-600 font-bold">Ha</span></td>
                        <td className="py-3 px-3 text-slate-600">Model identifikatori: <code>iportal-ai</code>, <code>iportal-ai-reasoning</code>, <code>iportal-ai-coder</code>, <code>iportal-ai-fast</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">messages</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">array</td>
                        <td className="py-3 px-3"><span className="text-rose-600 font-bold">Ha</span></td>
                        <td className="py-3 px-3 text-slate-600">Suhbat tarixi: <code>[{`{"role": "user", "content": "..."}`}]</code></td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">stream</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">boolean</td>
                        <td className="py-3 px-3 text-slate-400">Yo'q (default: false)</td>
                        <td className="py-3 px-3 text-slate-600">Server-Sent Events (SSE) orqali jonli oqimda javob olish</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">temperature</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">number</td>
                        <td className="py-3 px-3 text-slate-400">Yo'q (default: 0.7)</td>
                        <td className="py-3 px-3 text-slate-600">Ijodiylik darajasi (0.0 dan 1.0 gacha)</td>
                      </tr>
                      <tr>
                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">max_tokens</td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">number</td>
                        <td className="py-3 px-3 text-slate-400">Yo'q</td>
                        <td className="py-3 px-3 text-slate-600">Javobdagi maksimal tokenlar soni</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: IMAGES */}
          {activeSection === 'images' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-50 border border-pink-200 text-pink-800 text-xs font-bold">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Neural Image Synthesis</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  POST /api/v1/images/generate
                </h2>
                <p className="text-sm text-slate-600">
                  iportal Image Studio orqali yuqori aniqlikdagi fotorealistik tasvirlar yaratish.
                </p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-4 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-slate-300 font-mono font-semibold">
                    <Terminal className="w-3.5 h-3.5 text-pink-400" />
                    <span>Rasm Yaratish cURL Namuna</span>
                  </div>
                  <button
                    onClick={() => copyToClipboard(imageCurl, 'img-curl')}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors cursor-pointer"
                  >
                    {copiedSnippet === 'img-curl' ? <Check className="w-3.5 h-3.5 text-pink-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'img-curl' ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-pink-300 overflow-x-auto leading-relaxed">
                  {imageCurl}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: SDKS */}
          {activeSection === 'sdks' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-800 text-xs font-bold">
                  <Code2 className="w-3.5 h-3.5" />
                  <span>Dasturlash Tillari & SDKs</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Ko'p Tillik Dasturlash SDK Namunalari
                </h2>
                <p className="text-sm text-slate-600">
                  O'zingizga qulay dasturlash tilini tanlang va tayyor integratsiya kodini loyihangizga ko'chirib oling.
                </p>
              </div>

              {/* Language Tabs */}
              <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100">
                {(['curl', 'python', 'node', 'nextjs', 'go', 'php'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveSdkTab(tab)}
                    className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeSdkTab === tab 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'node' ? 'Node.js' : tab === 'nextjs' ? 'Next.js 15' : tab === 'go' ? 'Golang' : tab === 'php' ? 'PHP' : tab}
                  </button>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">{activeSdkTab.toUpperCase()} Integration Snippet</span>
                  <button
                    onClick={() => copyToClipboard(codeSnippets[activeSdkTab], `sdk-${activeSdkTab}`)}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedSnippet === `sdk-${activeSdkTab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === `sdk-${activeSdkTab}` ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {codeSnippets[activeSdkTab]}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: CURSOR / VS CODE */}
          {activeSection === 'cursor' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-200 text-blue-800 text-xs font-bold">
                  <Laptop className="w-3.5 h-3.5" />
                  <span>AI Dasturchi Muhiti</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Cursor IDE & VS Code Integratsiyasi
                </h2>
                <p className="text-sm text-slate-600">
                  Cursor IDE sozlamalariga <code className="text-emerald-700 font-mono">https://ai.iportal.uz/api/v1</code> manzilini kiriting va kod yozishda iportal AI kuchidan foydalaning.
                </p>
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">Cursor settings.json konfiguratsiyasi</span>
                  <button
                    onClick={() => copyToClipboard(cursorSettings, 'cursor-cfg')}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedSnippet === 'cursor-cfg' ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedSnippet === 'cursor-cfg' ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>
                <pre className="p-5 text-xs font-mono text-blue-300 overflow-x-auto leading-relaxed">
                  {cursorSettings}
                </pre>
              </div>
            </div>
          )}

          {/* SECTION: ERRORS & LIMITS */}
          {activeSection === 'errors' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  <span>Xatolik Kodlari</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  Status Kodlari & Limitlar
                </h2>
                <p className="text-sm text-slate-600">
                  Standart HTTP status javoblari va ularning ma'nolari.
                </p>
              </div>

              <div className="bg-white rounded-3xl border border-slate-200 p-5 shadow-xs space-y-4">
                <div className="space-y-3 font-mono text-xs">
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <strong className="text-emerald-700">200 OK</strong> — Muvaffaqiyatli so'rov.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <strong className="text-amber-700">401 Unauthorized</strong> — Noto'g'ri yoki yaroqsiz API kalit.
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <strong className="text-rose-700">429 Too Many Requests</strong> — Daqiqalik limitdan oshib ketildi.
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION: PLAYGROUND */}
          {activeSection === 'playground' && (
            <div className="space-y-6 animate-in fade-in">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Jonli Interaktiv Sinov</span>
                </div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                  API Test Playground
                </h2>
                <p className="text-sm text-slate-600">
                  Brauzerdan chiqmasdan real-vaqtli SSE streaming so'rovlarini sinab ko'ring.
                </p>
              </div>

              <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      Model
                    </label>
                    <select
                      value={playModel}
                      onChange={(e) => setPlayModel(e.target.value)}
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono font-bold text-slate-800"
                    >
                      <option value="iportal-ai">iportal 1.0 (Flagship)</option>
                      <option value="iportal-ai-reasoning">iportal Reasoning (Neural Logic)</option>
                      <option value="iportal-ai-coder">iportal Code Master</option>
                      <option value="iportal-ai-fast">iportal Turbo (Ultra-Fast 1000 tok/s)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                      API Kalitingiz (ixtiyoriy)
                    </label>
                    <input
                      type="text"
                      value={playKey}
                      onChange={(e) => setPlayKey(e.target.value)}
                      placeholder="ip-live-xxxxxxxx"
                      className="w-full p-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-mono text-slate-800 placeholder-slate-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                    Prompt (Savolingiz)
                  </label>
                  <textarea
                    rows={3}
                    value={playPrompt}
                    onChange={(e) => setPlayPrompt(e.target.value)}
                    className="w-full p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-sans resize-y"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3 text-xs font-mono">
                    {playStatus && (
                      <span className={`font-bold ${playStatus === 200 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        HTTP {playStatus}
                      </span>
                    )}
                    {playLatency && (
                      <span className="text-slate-500">
                        ⚡️ {playLatency} ms
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleTestPlayground}
                    disabled={playLoading}
                    className="px-5 py-2 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {playLoading ? (
                      <div className="w-3.5 h-3.5 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                    ) : (
                      <Play className="w-3.5 h-3.5 fill-current" />
                    )}
                    <span>{playLoading ? 'Yuborilmoqda...' : 'Yuborish & Sinash'}</span>
                  </button>
                </div>

                {/* Output Box */}
                {playResponse && (
                  <div className="mt-4 p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-emerald-300 whitespace-pre-wrap max-h-80 overflow-y-auto leading-relaxed">
                    {playResponse}
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
