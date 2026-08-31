'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  X, 
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
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Clock,
  Activity,
  Layers,
  BarChart3,
  DollarSign,
  TrendingUp,
  Download,
  FileSpreadsheet,
  Coins,
  Cpu
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiKeyItem } from '@/lib/core/types';
import { CostComparisonReport } from '@/lib/core/billingCalculator';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser?: any;
  onOpenAuth?: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ 
  isOpen, 
  onClose, 
  currentUser,
  onOpenAuth 
}) => {
  const [keys, setKeys] = useState<(ApiKeyItem & { savedUsd?: number; savedUzs?: number; formattedSavedUsd?: string; formattedSavedUzs?: string; totalTokens?: number })[]>([]);
  const [billingReport, setBillingReport] = useState<CostComparisonReport | null>(null);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [selectedKeyScope, setSelectedKeyScope] = useState<'all' | 'chat' | 'images'>('all');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeModalTab, setActiveModalTab] = useState<'keys' | 'stats' | 'snippets'>('keys');
  const [activeCodeTab, setActiveCodeTab] = useState<'curl' | 'python' | 'node' | 'nextjs' | 'cursor'>('curl');
  const [justCreatedKey, setJustCreatedKey] = useState<ApiKeyItem | null>(null);
  
  // Key tester state
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; success: boolean; latency: number; message: string } | null>(null);

  const token = typeof window !== 'undefined' ? localStorage.getItem('iportal_auth_token') || '' : '';

  const fetchKeys = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const res = await fetch('/api/user/keys', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
        if (data.billingReport) {
          setBillingReport(data.billingReport);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchKeys();
    }
  }, [isOpen, token]);

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

  if (!isOpen) return null;

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-emerald-100 text-emerald-800">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  API Kalitlar & Billing Tahlili
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  OpenAI Compatible
                </span>
              </div>
              <p className="text-xs text-slate-500">
                Kalitlar boshqaruvi, real-vaqtli statistika va tijoriy tejalgan mablag' hisoboti
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-xl hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Navigation Tabs */}
        <div className="flex items-center justify-between px-5 pt-3 border-b border-slate-100 bg-white overflow-x-auto">
          <div className="flex gap-2 shrink-0">
            <button
              onClick={() => setActiveModalTab('keys')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'keys'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Key className="w-3.5 h-3.5" />
              <span>Kalitlarim ({keys.length})</span>
            </button>

            <button
              onClick={() => setActiveModalTab('stats')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'stats'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-purple-600" />
              <span>Statistika & Billing</span>
              <span className="text-[9px] px-1.5 py-0.2 rounded-full bg-purple-100 text-purple-700 font-bold">Tejaldi</span>
            </button>

            <button
              onClick={() => setActiveModalTab('snippets')}
              className={`pb-2.5 px-3 text-xs font-bold transition-all border-b-2 cursor-pointer flex items-center gap-1.5 ${
                activeModalTab === 'snippets'
                  ? 'border-emerald-600 text-emerald-700'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
              }`}
            >
              <Code2 className="w-3.5 h-3.5 text-amber-600" />
              <span>SDK & Kodlar</span>
            </button>
          </div>

          <Link
            href="/docs"
            onClick={onClose}
            className="hidden sm:flex items-center gap-1.5 pb-2.5 text-xs font-bold text-slate-600 hover:text-emerald-700 transition-colors shrink-0"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>To'liq Docs Portal</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </Link>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* If user is not logged in */}
          {!currentUser && (
            <div className="p-6 rounded-3xl bg-gradient-to-br from-emerald-500/10 via-emerald-500/5 to-transparent border border-emerald-500/20 text-center space-y-4">
              <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-700 mx-auto flex items-center justify-center">
                <Sparkles className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <h3 className="font-extrabold text-slate-900 text-sm">
                  Shaxsiy API Kalitingizni Oling
                </h3>
                <p className="text-xs text-slate-600 max-w-md mx-auto">
                  Ro'yxatdan o'ting va <strong>1-klikda bepul API kalit</strong> oling. Llama 3.3 70B va DeepSeek R1 modellarini loyihalaringizga bevosita ulang.
                </p>
              </div>
              <button
                onClick={() => {
                  onClose();
                  onOpenAuth?.();
                }}
                className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer inline-flex items-center gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span>Kirish / Ro'yxatdan O'tish</span>
              </button>
            </div>
          )}

          {/* TAB 1: KEYS MANAGEMENT */}
          {currentUser && activeModalTab === 'keys' && (
            <div className="space-y-6">
              {/* Newly Created Key Alert */}
              {justCreatedKey && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-2 animate-in zoom-in-95">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Yangi API Kalit Muvaffaqiyatli Yaratildi!
                    </span>
                    <button
                      onClick={() => setJustCreatedKey(null)}
                      className="text-emerald-700 hover:text-emerald-900 text-xs font-bold"
                    >
                      Yopish
                    </button>
                  </div>
                  <p className="text-[11px] text-emerald-700">
                    Iltimos, ushbu kalitni xavfsiz joyga saqlang. Xavfsizlik maqsadida u keyinroq to'liq ko'rsatilmaydi:
                  </p>
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-emerald-300 font-mono text-xs text-slate-900 font-bold">
                    <span className="truncate select-all">{justCreatedKey.key}</span>
                    <button
                      onClick={() => copyToClipboard(justCreatedKey.key, 'just-created')}
                      className="ml-2 flex items-center gap-1 px-3 py-1 rounded-lg bg-[#00d68f] text-slate-950 text-xs font-bold hover:bg-[#00bf80] cursor-pointer"
                    >
                      {copiedKey === 'just-created' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedKey === 'just-created' ? 'Nusxalandi' : 'Nusxalash'}</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Create Key Form */}
              <form onSubmit={handleCreateKey} className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h3 className="font-bold text-xs text-slate-800">Yangi API Kalit Yaratish</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="Kalit nomi (masalan: Production App, Cursor IDE, Telegram Bot)..."
                    className="flex-1 px-3.5 py-2.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 shadow-xs"
                  />
                  <button
                    type="submit"
                    disabled={!newKeyName.trim()}
                    className="px-4 py-2.5 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-sm transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    <Plus className="w-4 h-4 stroke-[2.5]" />
                    <span>Yaratish</span>
                  </button>
                </div>
              </form>

              {/* Keys List */}
              <div className="space-y-3">
                <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">
                  Faol API Kalitlaringiz ({keys.length})
                </h3>

                {loading ? (
                  <div className="p-8 text-center text-xs text-slate-400">Kalitlar yuklanmoqda...</div>
                ) : keys.length === 0 ? (
                  <div className="p-8 text-center rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-400">
                    Sizda hali yaratilgan API kalit yo'q. Yuqoridagi forma orqali birinchi kalitingizni yarating.
                  </div>
                ) : (
                  keys.map((k) => {
                    const masked = k.key.length > 12 
                      ? `${k.key.substring(0, 8)}••••••••${k.key.substring(k.key.length - 4)}` 
                      : k.key;
                    const isTesting = testingKeyId === k.id;
                    const result = testResult?.id === k.id ? testResult : null;

                    return (
                      <div
                        key={k.id}
                        className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs hover:border-slate-300 transition-all space-y-2.5"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500" />
                            <span className="font-bold text-xs text-slate-900">{k.name}</span>
                            <span className="text-[10px] font-mono text-slate-400">
                              {new Date(k.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleTestKey(k)}
                              disabled={isTesting}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors cursor-pointer flex items-center gap-1"
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
                              className="p-1.5 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Bekor qilish va o'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>

                        {/* Masked Key & Copy */}
                        <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-100 font-mono text-xs text-slate-700">
                          <span className="truncate">{masked}</span>
                          <button
                            onClick={() => copyToClipboard(k.key, k.id)}
                            className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white border border-slate-200 hover:bg-slate-100 text-slate-800 text-[11px] font-semibold transition-colors cursor-pointer"
                          >
                            {copiedKey === k.id ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                            <span>{copiedKey === k.id ? 'Nusxalandi' : 'Nusxalash'}</span>
                          </button>
                        </div>

                        {/* Usage Metrics Bar */}
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
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

                        {/* Test Result Message */}
                        {result && (
                          <div className={`p-2 rounded-xl text-[11px] font-mono flex items-center gap-1.5 ${
                            result.success 
                              ? 'bg-emerald-50 border border-emerald-200 text-emerald-800' 
                              : 'bg-rose-50 border border-rose-200 text-rose-800'
                          }`}>
                            {result.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                            <span>{result.message}</span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BILLING & FINANCIAL SAVINGS DASHBOARD */}
          {currentUser && activeModalTab === 'stats' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Financial Hero Savings Banner */}
              <div className="p-5 sm:p-6 rounded-3xl bg-gradient-to-br from-slate-950 via-slate-900 to-[#07130e] text-white border border-emerald-500/30 shadow-2xl relative overflow-hidden space-y-4">
                <div className="absolute -top-12 -right-12 w-44 h-44 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5" />
                      Tijoriy AI Tariflariga Nisbatan Tejalgan Mablag'
                    </span>
                    <div className="flex items-baseline gap-2.5">
                      <span className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        {billingReport?.formattedTotalSavedUsd || '$0.00'}
                      </span>
                      <span className="text-sm font-semibold text-emerald-400">
                        ({billingReport?.formattedTotalSavedUzs || '0 so\'m'})
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={handleExportBillingReport}
                    className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition-all border border-slate-700 cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Hisobotni Yuklab Olish (JSON)</span>
                  </button>
                </div>

                {/* Market Benchmark Comparisons */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800/80 text-xs">
                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">OpenAI GPT-4o da</span>
                    <div className="font-bold text-slate-200 font-mono">{billingReport?.formattedOpenAiCost || '$0.00'}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">Claude 3.5 da</span>
                    <div className="font-bold text-purple-300 font-mono">{billingReport?.formattedClaudeCost || '$0.00'}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">DeepSeek API da</span>
                    <div className="font-bold text-cyan-300 font-mono">{billingReport?.formattedDeepSeekCost || '$0.00'}</div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-slate-900/80 border border-slate-800 space-y-0.5">
                    <span className="text-[10px] text-slate-400 uppercase font-mono">iportal Narxi</span>
                    <div className="font-bold text-emerald-400 font-mono">100% Bepul</div>
                  </div>
                </div>
              </div>

              {/* 3 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="font-semibold">Jami API So'rovlar</span>
                    <Activity className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {totalRequestsSum.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Muvaffaqiyat: 99.9%</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="font-semibold">Sarflangan Tokenlar</span>
                    <Coins className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {totalTokensSum.toLocaleString()}
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Input + Output Tokens</span>
                </div>

                <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-400 text-xs">
                    <span className="font-semibold">Hisoblash Quvvati</span>
                    <Cpu className="w-4 h-4 text-amber-600" />
                  </div>
                  <div className="text-xl font-extrabold text-slate-900 font-mono">
                    {billingReport?.equivalentComputeHours || 0} soat
                  </div>
                  <span className="text-[10px] text-slate-500 font-mono">Cerebras & Groq LPU</span>
                </div>
              </div>

              {/* Per Key Detailed Analytics Breakdown */}
              <div className="bg-white rounded-3xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-bold text-xs uppercase tracking-wider text-slate-400">
                    Kalitlar Bo'yicha Sarf-Xarajat Jadvali
                  </h3>
                  <span className="text-[11px] font-mono text-slate-500">Real-vaqtli hisobot</span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 uppercase text-[10px] font-mono">
                        <th className="py-2.5 px-3">Kalit Nomi</th>
                        <th className="py-2.5 px-3">So'rovlar</th>
                        <th className="py-2.5 px-3">Tokenlar</th>
                        <th className="py-2.5 px-3">Tejalgan ($)</th>
                        <th className="py-2.5 px-3">Holati</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-xs">
                      {keys.map((k) => (
                        <tr key={k.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-3">
                            <div className="font-bold font-sans text-slate-900">{k.name}</div>
                            <span className="text-[10px] text-slate-400">
                              {k.key.substring(0, 8)}...{k.key.substring(k.key.length - 4)}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-700 font-bold">{k.requestsCount}</td>
                          <td className="py-3 px-3 text-slate-700 font-bold">{(k.totalTokens || 0).toLocaleString()}</td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            {k.formattedSavedUsd || '$0.00'}
                          </td>
                          <td className="py-3 px-3">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                              Faol
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

          {/* TAB 3: CODE SNIPPETS */}
          {currentUser && activeModalTab === 'snippets' && (
            <div className="space-y-4">
              <div className="flex flex-wrap gap-1.5 p-1 rounded-xl bg-slate-100">
                {(['curl', 'python', 'node', 'nextjs', 'cursor'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveCodeTab(tab)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold uppercase transition-all cursor-pointer ${
                      activeCodeTab === tab 
                        ? 'bg-white text-slate-900 shadow-xs' 
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab === 'node' ? 'Node.js' : tab === 'nextjs' ? 'Next.js 15' : tab === 'cursor' ? 'Cursor IDE' : tab}
                  </button>
                ))}
              </div>

              <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-hidden shadow-lg">
                <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                  <span className="font-mono text-slate-300 font-semibold">{activeCodeTab.toUpperCase()} Integration</span>
                  <button
                    onClick={() => copyToClipboard(codeSnippets[activeCodeTab], `tab-${activeCodeTab}`)}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors cursor-pointer"
                  >
                    {copiedKey === `tab-${activeCodeTab}` ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedKey === `tab-${activeCodeTab}` ? 'Nusxalandi' : 'Nusxalash'}</span>
                  </button>
                </div>
                <pre className="p-4 text-xs font-mono text-emerald-300 overflow-x-auto leading-relaxed">
                  {codeSnippets[activeCodeTab]}
                </pre>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center justify-between">
                <span>Ko'proq tillar va frameworklar (Go, PHP, LangChain) kerakmi?</span>
                <Link
                  href="/docs"
                  onClick={onClose}
                  className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                >
                  <span>Hujjatlar Portaliga O'tish</span>
                  <ExternalLink className="w-3 h-3" />
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
