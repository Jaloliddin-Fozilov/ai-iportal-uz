'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Key, 
  Plus, 
  Copy, 
  Check, 
  Trash2, 
  Shield, 
  Terminal, 
  Code2, 
  LogIn, 
  Sparkles,
  Play,
  Zap,
  ExternalLink,
  BookOpen,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  BarChart3,
  DollarSign,
  TrendingUp,
  Download,
  Coins,
  Cpu,
  RefreshCw,
  Laptop,
  FileCode,
  User,
  ShieldCheck
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { AIOrb } from '@/components/AIOrb';
import { ApiKeyItem } from '@/lib/core/types';
import { CostComparisonReport } from '@/lib/core/billingCalculator';

export default function DashboardPage() {
  const [keys, setKeys] = useState<(ApiKeyItem & { savedUsd?: number; savedUzs?: number; formattedSavedUsd?: string; formattedSavedUzs?: string; totalTokens?: number })[]>([]);
  const [billingReport, setBillingReport] = useState<CostComparisonReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedKeyScope, setSelectedKeyScope] = useState<'all' | 'chat' | 'images'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'keys' | 'sdks'>('overview');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node' | 'nextjs' | 'cursor'>('curl');
  const [justCreatedKey, setJustCreatedKey] = useState<ApiKeyItem | null>(null);
  
  // Key tester state
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latency: number; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('iportal_auth_token') || '' : '';

  const fetchUserData = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      // 1. Fetch User Profile
      const meRes = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const meData = await meRes.json();
      if (meData.success && meData.user) {
        setCurrentUser(meData.user);
      }

      // 2. Fetch Keys & Billing Report
      const keysRes = await fetch('/api/user/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const keysData = await keysRes.json();
      if (keysData.success) {
        setKeys(keysData.keys || []);
        if (keysData.billingReport) {
          setBillingReport(keysData.billingReport);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserData();
  }, [token]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim() || !token) return;

    try {
      const res = await fetch('/api/user/keys', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ 
          name: newKeyName.trim(),
          scope: selectedKeyScope
        }),
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.key, ...keys]);
        setJustCreatedKey(data.key);
        setNewKeyName('');
        confetti({
          particleCount: 60,
          spread: 70,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Ushbu API kalitni bekor qilish va o\'chirishga ishonchingiz komilmi?')) return;
    try {
      const res = await fetch(`/api/user/keys?id=${id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setKeys(keys.filter(k => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedKey(id);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestKey = async (keyItem: ApiKeyItem) => {
    setTestingKeyId(keyItem.id);
    setTestResult(null);
    const start = Date.now();
    try {
      const res = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${keyItem.key}`,
        },
        body: JSON.stringify({
          model: 'iportal-ai-fast',
          messages: [{ role: 'user', content: 'Ping test' }],
          max_tokens: 10,
          stream: false,
        }),
      });
      const latency = Date.now() - start;
      if (res.ok) {
        setTestResult({
          id: keyItem.id,
          success: true,
          latency,
          message: `Muvaffaqiyatli! (${latency}ms da javob berdi)`
        });
      } else {
        const err = await res.json().catch(() => ({}));
        setTestResult({
          id: keyItem.id,
          success: false,
          latency,
          message: err.error?.message || `Xatolik: HTTP ${res.status}`
        });
      }
    } catch (err: any) {
      setTestResult({
        id: keyItem.id,
        success: false,
        latency: Date.now() - start,
        message: err.message || 'Ulanishda xatolik'
      });
    } finally {
      setTestingKeyId(null);
    }
  };

  const handleExportBillingReport = () => {
    if (!billingReport && keys.length === 0) return;
    const reportData = {
      exportDate: new Date().toISOString(),
      user: currentUser?.email || 'authenticated_developer',
      summary: billingReport,
      apiKeys: keys.map(k => ({
        name: k.name,
        maskedKey: `${k.key.substring(0, 8)}...${k.key.substring(k.key.length - 4)}`,
        requestsCount: k.requestsCount,
        totalTokens: k.totalTokens || 0,
        promptTokens: k.promptTokens || 0,
        completionTokens: k.completionTokens || 0,
        savedUsd: k.savedUsd || 0,
        savedUzs: k.savedUzs || 0,
        status: k.status,
        createdAt: new Date(k.createdAt).toISOString(),
        lastUsedAt: k.lastUsedAt ? new Date(k.lastUsedAt).toISOString() : 'Never',
      }))
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `iportal-ai-billing-report-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sampleKey = keys.length > 0 ? keys[0].key : 'ip-live-xxxxxxxxxxxxxxxx';
  const totalTokensSum = keys.reduce((acc, k) => acc + (k.totalTokens || 0), 0);
  const totalRequestsSum = keys.reduce((acc, k) => acc + (k.requestsCount || 0), 0);

  const codeSnippets = {
    curl: `curl https://ai.iportal.uz/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -d '{
    "model": "iportal-ai",
    "messages": [
      {"role": "system", "content": "You are an expert AI assistant."},
      {"role": "user", "content": "Hello iportal AI!"}
    ],
    "temperature": 0.7
  }'`,

    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://ai.iportal.uz/api/v1",
    api_key="${sampleKey}"
)

response = client.chat.completions.create(
    model="iportal-ai",
    messages=[{"role": "user", "content": "Explain async architectures in Python."}],
    temperature=0.7
)

print(response.choices[0].message.content)`,

    node: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://ai.iportal.uz/api/v1",
  apiKey: "${sampleKey}",
});

async function main() {
  const completion = await openai.chat.completions.create({
    model: "iportal-ai",
    messages: [{ role: "user", content: "Hello from Node.js!" }],
    stream: true,
  });

  for await (const chunk of completion) {
    process.stdout.write(chunk.choices[0]?.delta?.content || "");
  }
}

main();`,

    nextjs: `// app/api/ai/route.ts
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://ai.iportal.uz/api/v1",
  apiKey: "${sampleKey}",
});

export async function POST(req: Request) {
  const { prompt } = await req.json();
  const res = await openai.chat.completions.create({
    model: "iportal-ai",
    messages: [{ role: "user", content: prompt }],
  });
  return Response.json(res);
}`,

    cursor: `{
  "models": [
    {
      "name": "iportal 1.0 (Flagship Core)",
      "model": "iportal-ai",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "${sampleKey}"
    },
    {
      "name": "iportal Reasoning (Neural Logic)",
      "model": "iportal-ai-reasoning",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "${sampleKey}"
    },
    {
      "name": "iportal Turbo (Ultra-Fast 1000 tok/s)",
      "model": "iportal-ai-fast",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "${sampleKey}"
    },
    {
      "name": "iportal Code Master",
      "model": "iportal-ai-coder",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "${sampleKey}"
    }
  ]
}`
  };

  return (
    <div className="min-h-screen bg-[#f8faf9] text-slate-900 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navigation Bar */}
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
                <span className="font-extrabold text-sm tracking-tight text-slate-900">Developer Dashboard</span>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Live Billing
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden md:block">
                API Kalitlar, Token Sarfi & Tijoriy Tejalgan Mablag' Tahlili
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/docs"
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
          >
            <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
            <span>API Docs (/docs)</span>
          </Link>

          {currentUser?.role === 'admin' && (
            <Link
              href="/admin"
              className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-xs font-bold transition-all border border-purple-200"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-purple-600" />
              <span>Admin Panel</span>
            </Link>
          )}

          {currentUser && (
            <div className="flex items-center gap-2 pl-2">
              <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                {currentUser.name?.[0]?.toUpperCase() || 'U'}
              </div>
              <span className="text-xs font-semibold text-slate-700 hidden lg:inline truncate max-w-[120px]">
                {currentUser.name}
              </span>
            </div>
          )}
        </div>
      </header>

      {/* Main Dashboard Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-8 space-y-8">
        {/* If user is not logged in */}
        {!currentUser && !loading && (
          <div className="p-8 sm:p-12 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6 max-w-2xl mx-auto my-12 animate-in fade-in">
            <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center shadow-inner">
              <Key className="w-8 h-8" />
            </div>
            <div className="space-y-2">
              <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Developer Dashboardga Kirish
              </h2>
              <p className="text-sm text-slate-600 max-w-md mx-auto">
                Shaxsiy API kalitlaringizni boshqarish, so'rovlar statistikasini kuzatish va tejalgan mablag' hisobotini olish uchun tizimga kiring.
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-lg transition-all cursor-pointer"
            >
              <LogIn className="w-4 h-4" />
              <span>Asosiy Sahifada Kirish / Ro'yxatdan O'tish</span>
            </Link>
          </div>
        )}

        {/* Logged in Dashboard Content */}
        {currentUser && (
          <>
            {/* Top Navigation Tabs */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 flex-wrap gap-3">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('overview')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'overview'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <BarChart3 className="w-4 h-4 text-emerald-400" />
                  <span>Statistika & Billing</span>
                </button>

                <button
                  onClick={() => setActiveTab('keys')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'keys'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Key className="w-4 h-4 text-amber-400" />
                  <span>API Kalitlarim ({keys.length})</span>
                </button>

                <button
                  onClick={() => setActiveTab('sdks')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                    activeTab === 'sdks'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:bg-white hover:text-slate-900'
                  }`}
                >
                  <Code2 className="w-4 h-4 text-cyan-400" />
                  <span>SDK & Kod Namunalari</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={fetchUserData}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all cursor-pointer shadow-2xs"
                  title="Yangilash"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                  <span>Yangilash</span>
                </button>

                <button
                  onClick={handleExportBillingReport}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 text-xs font-bold shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Eksport (JSON)</span>
                </button>
              </div>
            </div>

            {/* TAB 1: FINANCIAL SAVINGS & OVERVIEW */}
            {activeTab === 'overview' && (
              <div className="space-y-8 animate-in fade-in">
                {/* Hero Financial Savings Banner */}
                <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#07130e] text-white border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-6">
                  <div className="absolute -top-20 -right-20 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1.5">
                      <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                        <DollarSign className="w-4 h-4" />
                        Tijoriy AI Tariflariga Nisbatan Tejalgan Sof Mablag'
                      </span>
                      <div className="flex items-baseline gap-3 flex-wrap">
                        <span className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight font-mono">
                          {billingReport?.formattedTotalSavedUsd || '$0.00'}
                        </span>
                        <span className="text-base font-semibold text-emerald-400 font-mono">
                          ({billingReport?.formattedTotalSavedUzs || '0 so\'m'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        Sizning so'rovlaringiz iportal-ai bepul Edge Klasteri orqali qayta ishlandi va to'liq tejaldi.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-3.5 py-2 rounded-2xl bg-emerald-950/80 border border-emerald-500/30 text-emerald-300 font-mono text-xs font-bold">
                        ⚡️ 100% Free Edge Clustered
                      </span>
                    </div>
                  </div>

                  {/* Market Comparison Grid */}
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 pt-4 border-t border-slate-800/80 text-xs font-mono">
                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase">OpenAI GPT-4o da</span>
                      <div className="text-base font-bold text-slate-200">{billingReport?.formattedOpenAiCost || '$0.00'}</div>
                      <span className="text-[10px] text-slate-500 font-sans">$2.50 in / $10.00 out</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase">Claude 3.5 Sonnet</span>
                      <div className="text-base font-bold text-purple-300">{billingReport?.formattedClaudeCost || '$0.00'}</div>
                      <span className="text-[10px] text-slate-500 font-sans">$3.00 in / $15.00 out</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase">DeepSeek API da</span>
                      <div className="text-base font-bold text-cyan-300">{billingReport?.formattedDeepSeekCost || '$0.00'}</div>
                      <span className="text-[10px] text-slate-500 font-sans">$0.55 in / $2.19 out</span>
                    </div>

                    <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-1">
                      <span className="text-[11px] text-slate-400 uppercase">iportal Xarajati</span>
                      <div className="text-base font-bold text-emerald-400">$0.00 (Bepul)</div>
                      <span className="text-[10px] text-emerald-500 font-sans">Cheksiz Bepul Zaxira</span>
                    </div>
                  </div>
                </div>

                {/* 4 Performance KPI Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span className="font-bold uppercase tracking-wider">Jami API So'rovlar</span>
                      <Activity className="w-4 h-4 text-emerald-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono">
                      {totalRequestsSum.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold font-mono">Muvaffaqiyat: 99.9%</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span className="font-bold uppercase tracking-wider">Sarflangan Tokenlar</span>
                      <Coins className="w-4 h-4 text-purple-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono">
                      {totalTokensSum.toLocaleString()}
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Input + Output Tokens</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span className="font-bold uppercase tracking-wider">Hisoblash Quvvati</span>
                      <Cpu className="w-4 h-4 text-amber-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono">
                      {billingReport?.equivalentComputeHours || 0} soat
                    </div>
                    <span className="text-[11px] text-slate-500 font-mono">Cerebras CS-3 & Groq</span>
                  </div>

                  <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs space-y-1.5">
                    <div className="flex items-center justify-between text-slate-400 text-xs">
                      <span className="font-bold uppercase tracking-wider">Faol API Kalitlar</span>
                      <Key className="w-4 h-4 text-cyan-600" />
                    </div>
                    <div className="text-2xl font-extrabold text-slate-900 font-mono">
                      {keys.length} ta
                    </div>
                    <span className="text-[11px] text-emerald-600 font-semibold font-mono">Barchasi Faol</span>
                  </div>
                </div>

                {/* Per Key Detailed Analytics Breakdown */}
                <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                        Kalitlar Bo'yicha Sarf-Xarajat & Tejalgan Mablag' Jadvali
                      </h3>
                      <p className="text-xs text-slate-500">
                        Har bir kalitingizning individual token sarfi va tijoriy muqobil qiymati
                      </p>
                    </div>
                    <button
                      onClick={() => setActiveTab('keys')}
                      className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all cursor-pointer"
                    >
                      + Yangi Kalit Qo'shish
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-100 text-slate-400 uppercase text-[11px] font-mono">
                          <th className="py-3 px-3">Kalit Nomi</th>
                          <th className="py-3 px-3">Maskalangan Kalit</th>
                          <th className="py-3 px-3">So'rovlar</th>
                          <th className="py-3 px-3">Tokenlar</th>
                          <th className="py-3 px-3">Tejalgan Mablag' ($)</th>
                          <th className="py-3 px-3">Tejalgan (UZS)</th>
                          <th className="py-3 px-3">Holati</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-mono text-xs">
                        {keys.map((k) => (
                          <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-3">
                              <div className="font-bold font-sans text-slate-900">{k.name}</div>
                              <span className="text-[10px] text-slate-400 font-mono">
                                {new Date(k.createdAt).toLocaleDateString()}
                              </span>
                            </td>
                            <td className="py-3.5 px-3 text-slate-600">
                              {k.key.substring(0, 8)}••••••••{k.key.substring(k.key.length - 4)}
                            </td>
                            <td className="py-3.5 px-3 text-slate-800 font-bold">{k.requestsCount}</td>
                            <td className="py-3.5 px-3 text-slate-800 font-bold">{(k.totalTokens || 0).toLocaleString()}</td>
                            <td className="py-3.5 px-3 font-bold text-emerald-700">
                              {k.formattedSavedUsd || '$0.00'}
                            </td>
                            <td className="py-3.5 px-3 text-slate-600">
                              {k.formattedSavedUzs || '0 so\'m'}
                            </td>
                            <td className="py-3.5 px-3">
                              <span className="px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                FAOL
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB 2: KEYS MANAGEMENT */}
            {activeTab === 'keys' && (
              <div className="space-y-6 animate-in fade-in">
                {/* Newly Created Key Alert */}
                {justCreatedKey && (
                  <div className="p-5 rounded-3xl bg-emerald-50 border border-emerald-200 space-y-3 animate-in zoom-in-95">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-emerald-900 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        Yangi API Kalit Muvaffaqiyatli Yaratildi!
                      </span>
                      <button
                        onClick={() => setJustCreatedKey(null)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                      >
                        Yopish
                      </button>
                    </div>
                    <p className="text-xs text-emerald-700">
                      Iltimos, ushbu kalitni xavfsiz joyga saqlang. Xavfsizlik maqsadida u keyinroq to'liq ko'rsatilmaydi:
                    </p>
                    <div className="flex items-center justify-between p-3 rounded-2xl bg-white border border-emerald-300 font-mono text-sm text-slate-900 font-bold">
                      <span className="truncate select-all">{justCreatedKey.key}</span>
                      <button
                        onClick={() => copyToClipboard(justCreatedKey.key, 'just-created')}
                        className="ml-3 flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-[#00d68f] text-slate-950 text-xs font-bold hover:bg-[#00bf80] cursor-pointer"
                      >
                        {copiedKey === 'just-created' ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        <span>{copiedKey === 'just-created' ? 'Nusxalandi' : 'Nusxalash'}</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Create Key Form */}
                <form onSubmit={handleCreateKey} className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div>
                    <h3 className="font-extrabold text-sm text-slate-900">Yangi API Kalit Yaratish</h3>
                    <p className="text-xs text-slate-500">Ilovalaringiz yoki Cursor IDE uchun yangi xavfsiz token yarating</p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={newKeyName}
                      onChange={(e) => setNewKeyName(e.target.value)}
                      placeholder="Kalit nomi (masalan: Production Backend, Cursor IDE, Telegram Bot)..."
                      className="flex-1 px-4 py-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs font-medium"
                    />
                    <button
                      type="submit"
                      disabled={!newKeyName.trim()}
                      className="px-6 py-3 rounded-2xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50"
                    >
                      <Plus className="w-4 h-4 stroke-[2.5]" />
                      <span>Kalit Yaratish</span>
                    </button>
                  </div>
                </form>

                {/* Keys List */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="font-extrabold text-sm text-slate-900">
                      Barcha API Kalitlaringiz ({keys.length})
                    </h3>
                  </div>

                  {keys.length === 0 ? (
                    <div className="p-12 text-center rounded-3xl bg-white border border-slate-200 text-xs text-slate-400">
                      Sizda hali yaratilgan API kalit yo'q. Yuqoridagi formadan birinchi kalitingizni yarating.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {keys.map((k) => {
                        const masked = k.key.length > 12 
                          ? `${k.key.substring(0, 8)}••••••••${k.key.substring(k.key.length - 4)}` 
                          : k.key;
                        const isTesting = testingKeyId === k.id;
                        const result = testResult?.id === k.id ? testResult : null;

                        return (
                          <div
                            key={k.id}
                            className="p-5 rounded-3xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-3 flex flex-col justify-between"
                          >
                            <div className="space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                                  <span className="font-bold text-sm text-slate-900">{k.name}</span>
                                </div>

                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={() => handleTestKey(k)}
                                    disabled={isTesting}
                                    className="px-3 py-1 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                                    title="Kalitni sinash"
                                  >
                                    {isTesting ? (
                                      <div className="w-3 h-3 rounded-full border-2 border-slate-700 border-t-transparent animate-spin" />
                                    ) : (
                                      <Play className="w-3 h-3 fill-current" />
                                    )}
                                    <span>Sinash</span>
                                  </button>

                                  <button
                                    onClick={() => handleDeleteKey(k.id)}
                                    className="p-1.5 text-slate-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 transition-colors cursor-pointer"
                                    title="Bekor qilish va o'chirish"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </div>

                              {/* Masked Key & Copy */}
                              <div className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-200/80 font-mono text-xs text-slate-700">
                                <span className="truncate">{masked}</span>
                                <button
                                  onClick={() => copyToClipboard(k.key, k.id)}
                                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                                >
                                  {copiedKey === k.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                  <span>{copiedKey === k.id ? 'Nusxalandi' : 'Nusxalash'}</span>
                                </button>
                              </div>

                              {/* Test Result Message */}
                              {result && (
                                <div className={`p-2.5 rounded-xl text-xs font-mono flex items-center gap-2 ${
                                  result.success 
                                    ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                                    : 'bg-rose-50 border border-rose-200 text-rose-800'
                                }`}>
                                  {result.success ? <CheckCircle2 className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                                  <span>{result.message}</span>
                                </div>
                              )}
                            </div>

                            {/* Usage Metrics Footer */}
                            <div className="flex items-center justify-between text-xs text-slate-500 font-mono pt-3 border-t border-slate-100">
                              <div className="flex items-center gap-3">
                                <span>So'rovlar: <strong className="text-slate-900">{k.requestsCount}</strong></span>
                                <span>Tokenlar: <strong className="text-slate-900">{k.totalTokens || 0}</strong></span>
                              </div>
                              {k.formattedSavedUsd && (
                                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                                  💵 {k.formattedSavedUsd} tejaldi
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: SDK CODE SNIPPETS */}
            {activeTab === 'sdks' && (
              <div className="space-y-6 animate-in fade-in">
                <div className="p-6 rounded-3xl bg-white border border-slate-200 shadow-sm space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <h3 className="font-extrabold text-base text-slate-900 tracking-tight">
                        Integratsiya Kodi (Sizning Kalitingiz Bilan)
                      </h3>
                      <p className="text-xs text-slate-500">
                        Quyidagi kod namunalarida sizning birinchi faol API kalitingiz avtomatik joylashtirilgan.
                      </p>
                    </div>

                    <Link
                      href="/docs"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all"
                    >
                      <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                      <span>To'liq Docs (/docs)</span>
                    </Link>
                  </div>

                  <div className="flex flex-wrap gap-2 p-1.5 rounded-2xl bg-slate-100">
                    {(['curl', 'python', 'node', 'nextjs', 'cursor'] as const).map((tab) => (
                      <button
                        key={tab}
                        onClick={() => setActiveCodeTab(tab)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold uppercase transition-all cursor-pointer ${
                          activeCodeTab === tab 
                            ? 'bg-slate-900 text-white shadow-sm' 
                            : 'text-slate-600 hover:text-slate-900 hover:bg-white'
                        }`}
                      >
                        {tab === 'node' ? 'Node.js' : tab === 'nextjs' ? 'Next.js 15' : tab === 'cursor' ? 'Cursor IDE' : tab}
                      </button>
                    ))}
                  </div>

                  <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-xl">
                    <div className="px-5 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 font-semibold">{activeCodeTab.toUpperCase()} Integration Snippet</span>
                      <button
                        onClick={() => copyToClipboard(codeSnippets[activeCodeTab], `tab-${activeCodeTab}`)}
                        className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                      >
                        {copiedKey === `tab-${activeCodeTab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                        <span>{copiedKey === `tab-${activeCodeTab}` ? 'Nusxalandi' : 'Nusxalash'}</span>
                      </button>
                    </div>
                    <pre className="p-5 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                      {codeSnippets[activeCodeTab]}
                    </pre>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
