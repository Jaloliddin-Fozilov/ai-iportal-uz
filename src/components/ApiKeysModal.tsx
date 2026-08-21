'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Copy, Check, Trash2, Shield, Terminal, Code2, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';
import { ApiKeyItem } from '@/lib/core/types';

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose }) => {
  const [keys, setKeys] = useState<ApiKeyItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'python' | 'node' | 'curl' | 'cursor'>('curl');

  const fetchKeys = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/keys');
      const data = await res.json();
      if (data.success) {
        setKeys(data.keys || []);
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
  }, [isOpen]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName.trim()) return;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newKeyName.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setKeys([data.key, ...keys]);
        setNewKeyName('');
        // Confetti celebration!
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
      const res = await fetch(`/api/keys?id=${id}&action=delete`, { method: 'DELETE' });
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
    curl: `curl https://ai.iportal.uz/v1/chat/completions \\
  -H "Content-Type: application/json" \\
  -H "Authorization: Bearer ${sampleKey}" \\
  -d '{
    "model": "iportal-ai",
    "messages": [{"role": "user", "content": "Salom, dunyo!"}],
    "stream": false
  }'`,

    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://ai.iportal.uz/v1",
    api_key="${sampleKey}"
)

response = client.chat.completions.create(
    model="iportal-ai",
    messages=[{"role": "user", "content": "Salom! Menga yordam bera olasizmi?"}]
)

print(response.choices[0].message.content)`,

    node: `import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://ai.iportal.uz/v1",
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
  "openai.baseUrl": "https://ai.iportal.uz/v1",
  "openai.apiKey": "${sampleKey}",
  "openai.model": "iportal-ai"
}`
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[90vh] bg-[#0d121f] border border-[#232f48] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">API Kalitlar Boshqaruvi</h2>
              <p className="text-xs text-gray-400">OpenAI-mos API orqali ai.iportal.uz ga ulanish kalitlari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2336] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Create Key Form */}
          <form onSubmit={handleCreateKey} className="flex gap-2">
            <input
              type="text"
              value={newKeyName}
              onChange={(e) => setNewKeyName(e.target.value)}
              placeholder="Yangi kalit nomi (masalan: My Telegram Bot, Python App...)"
              className="flex-1 px-4 py-2.5 rounded-xl bg-[#141a29] border border-[#232f48] text-sm text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              disabled={!newKeyName.trim()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-medium text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Kalit Yaratish</span>
            </button>
          </form>

          {/* Keys List */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400 font-medium">
              <span>Mavjud Kalitlar ({keys.length})</span>
              <span>So'rovlar Soni</span>
            </div>

            {loading ? (
              <div className="p-6 text-center text-xs text-gray-500">Yuklanmoqda...</div>
            ) : keys.length === 0 ? (
              <div className="p-6 text-center text-xs text-gray-500 bg-[#121726] rounded-xl border border-[#1e293f]">
                Hozircha kalitlar yaratilmagan. Yuqoridagi formadan yangi kalit yarating.
              </div>
            ) : (
              keys.map((k) => (
                <div
                  key={k.id}
                  className="flex items-center justify-between p-3.5 rounded-xl bg-[#121726] border border-[#1e293f] hover:border-[#2b3a58] transition-all"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{k.name}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {k.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-gray-400 mt-0.5 truncate select-all">
                        {k.key}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="font-mono text-xs text-blue-400 bg-[#1a2236] px-2 py-1 rounded-lg">
                      {k.requestsCount} req
                    </span>
                    <button
                      onClick={() => copyToClipboard(k.key, k.id)}
                      className="p-1.5 rounded-lg bg-[#1a2236] hover:bg-[#25314d] text-gray-300 hover:text-white transition-colors cursor-pointer"
                      title="Nusxa olish"
                    >
                      {copiedKey === k.id ? <Check className="w-4 h-4 text-green-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    {k.id !== 'default-master-key' && (
                      <button
                        onClick={() => handleDeleteKey(k.id)}
                        className="p-1.5 rounded-lg bg-[#1a2236] hover:bg-red-950/50 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="O'chirish"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Integration Examples */}
          <div className="pt-2 border-t border-[#1e293f]">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-blue-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Tezkor Integratsiya Misollari
              </h3>
            </div>

            {/* Code Tabs */}
            <div className="flex gap-1.5 p-1 bg-[#121726] rounded-xl border border-[#1e293f] w-fit mb-3">
              {(['curl', 'python', 'node', 'cursor'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-400 hover:text-white'
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
            <div className="relative rounded-xl overflow-hidden bg-[#090c14] border border-[#1a2336]">
              <div className="flex items-center justify-between px-3 py-1.5 bg-[#101524] border-b border-[#1a2336] text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-blue-400" />
                  <span className="font-mono text-[11px] text-gray-300">{activeTab} example</span>
                </div>
                <button
                  onClick={() => copyToClipboard(codeSnippets[activeTab], 'snippet')}
                  className="flex items-center gap-1 text-[11px] text-gray-300 hover:text-white bg-[#192136] px-2 py-0.5 rounded cursor-pointer"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-green-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'snippet' ? 'Nusxalandi' : 'Nusxa olish'}</span>
                </button>
              </div>
              <pre className="p-3 text-xs font-mono text-gray-200 overflow-x-auto leading-relaxed">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
