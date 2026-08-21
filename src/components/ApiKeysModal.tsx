'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Copy, Check, Trash2, Shield, Terminal, Code2, LogIn, Gift, DollarSign } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiKeyItem } from '@/lib/core/types';

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
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [balance, setBalance] = useState<number>(5.00);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl' | 'cursor'>('curl');

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
        if (data.balance !== undefined) setBalance(data.balance);
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
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.key, ...keys]);
        setNewKeyName('');
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteKey = async (id: string) => {
    if (!confirm('Ushbu API kalitni o\'chirishni tasdiqlaysizmi?')) return;
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

  if (!isOpen) return null;

  const sampleKey = keys.length > 0 ? keys[0].key : 'ip-live-xxxxxxxxxxxx';

  const codeSnippets = {
    curl: `curl https://ai.iportal.uz/api/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -d '{
    "model": "iportal-ai",
    "messages": [{"role": "user", "content": "Salom, dunyo!"}],
    "stream": false
  }'`,

    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://ai.iportal.uz/api/v1",
    api_key="${sampleKey}"
)

response = client.chat.completions.create(
    model="iportal-ai",
    messages=[{"role": "user", "content": "Salom! Menga yordam bera olasizmi?"}]
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
    messages: [{ role: "user", content: "Salom iportal-ai!" }],
  });

  console.log(completion.choices[0].message.content);
}

main();`,

    cursor: `{
  "models": [
    {
      "name": "iportal-ai 1.0",
      "model": "iportal-ai",
      "baseUrl": "https://ai.iportal.uz/api/v1",
      "apiKey": "${sampleKey}"
    }
  ]
}`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-[#0c101c] border border-[#1b253b] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#162035] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/25 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-white tracking-tight">Shaxsiy API Kalitlar & Balans</h2>
              <p className="text-[11px] sm:text-xs text-slate-400">OpenAI formatidagi shaxsiy API kalitlaringiz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#141b2b] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* If NOT logged in banner */}
          {!currentUser ? (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 to-cyan-950/40 border border-cyan-500/25 text-center space-y-3">
              <Gift className="w-8 h-8 mx-auto text-emerald-400 animate-bounce" />
              <h3 className="text-sm font-bold text-white">API Kalit olish uchun ro'yxatdan o'ting</h3>
              <p className="text-xs text-slate-300 max-w-md mx-auto leading-relaxed">
                Barcha yangi ro'yxatdan o'tgan foydalanuvchilarga bepul <strong>$5.00 balans</strong> va shaxsiy API kalit beriladi!
              </p>
              <button
                onClick={() => { onClose(); if (onOpenAuth) onOpenAuth(); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 cursor-pointer"
              >
                <LogIn className="w-4 h-4" />
                <span>Ro'yxatdan o'tish / Kirish (Free $5.00)</span>
              </button>
            </div>
          ) : (
            /* Logged in view */
            <>
              {/* Balance Card */}
              <div className="p-4 rounded-2xl bg-[#090d16] border border-[#162035] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <span className="text-xs text-slate-400">Joriy Balansingiz</span>
                  <div className="text-2xl font-bold text-emerald-400 font-mono tracking-tight">
                    ${balance.toFixed(2)} USD
                  </div>
                </div>
                <div className="sm:text-right text-[11px] text-slate-400">
                  <span>Hisob egasi:</span>
                  <div className="font-semibold text-white truncate max-w-xs">{currentUser.name} ({currentUser.email})</div>
                </div>
              </div>

              {/* Create Key Form */}
              <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Yangi kalit nomi (masalan: My Telegram Bot, Python App...)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#080b13] border border-[#192338] text-xs sm:text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  disabled={!newKeyName.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-semibold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Kalit Yaratish</span>
                </button>
              </form>

              {/* Keys List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                  <span>Sizning Kalitlaringiz ({keys.length})</span>
                  <span>So'rovlar Soni</span>
                </div>

                {loading ? (
                  <div className="p-6 text-center text-xs text-slate-500">Yuklanmoqda...</div>
                ) : keys.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-[#090d16] rounded-xl border border-[#162035]">
                    Hozircha kalitlar yaratilmagan. Yuqoridagi formadan yangi kalit yarating.
                  </div>
                ) : (
                  keys.map((k) => (
                    <div
                      key={k.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-xl bg-[#090d16] border border-[#162035] hover:border-[#22314e] transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white truncate">{k.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
                              {k.status}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-400 mt-0.5 truncate select-all">
                            {k.key}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-[#162035]">
                        <span className="font-mono text-xs text-cyan-400 bg-[#121a2c] px-2 py-1 rounded-lg border border-[#1b2742]">
                          {k.requestsCount} req
                        </span>
                        <button
                          onClick={() => copyToClipboard(k.key, k.id)}
                          className="p-1.5 rounded-lg bg-[#121a2c] hover:bg-[#1b2742] text-slate-300 hover:text-white transition-colors cursor-pointer"
                          title="Nusxa olish"
                        >
                          {copiedKey === k.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded-lg bg-[#121a2c] hover:bg-red-950/50 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </>
          )}

          {/* Quick Integration Examples */}
          <div className="pt-4 border-t border-[#162035]">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Tezkor Integratsiya Misollari
              </h3>
            </div>

            {/* Code Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-[#090d16] rounded-xl border border-[#162035] w-fit mb-3">
              {(['curl', 'python', 'node', 'cursor'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {tab === 'curl' && 'cURL'}
                  {tab === 'python' && 'Python (openai)'}
                  {tab === 'node' && 'Node.js (openai)'}
                  {tab === 'cursor' && 'Cursor / VS Code'}
                </button>
              ))}
            </div>

            {/* Code snippet display */}
            <div className="relative rounded-xl overflow-hidden bg-[#070a12] border border-[#162035]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#0d121f] border-b border-[#162035] text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                  <span className="font-mono text-[11px] text-slate-300">{activeTab} example</span>
                </div>
                <button
                  onClick={() => copyToClipboard(codeSnippets[activeTab], 'snippet')}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-[#141b2c] px-2 py-0.5 rounded cursor-pointer"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'snippet' ? 'Nusxalandi' : 'Nusxa olish'}</span>
                </button>
              </div>
              <pre className="p-3.5 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
