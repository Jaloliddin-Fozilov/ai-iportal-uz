'use client';

import React, { useState, useEffect } from 'react';
import { X, Key, Plus, Copy, Check, Trash2, Shield, Terminal, Code2, LogIn, Sparkles } from 'lucide-react';
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
    if (!confirm('Are you sure you want to revoke and delete this API key?')) return;
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
    "messages": [{"role": "user", "content": "Hello iportal!"}],
    "stream": false
  }'`,

    python: `from openai import OpenAI

client = OpenAI(
    base_url="https://ai.iportal.uz/api/v1",
    api_key="${sampleKey}"
)

response = client.chat.completions.create(
    model="iportal-ai",
    messages=[{"role": "user", "content": "Hello! How do I implement async caching?"}]
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
    messages: [{ role: "user", content: "Hello iportal AI!" }],
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-amber-500/10 text-amber-600">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">Developer API Keys</h2>
              <p className="text-[11px] sm:text-xs text-slate-500">Manage your OpenAI-compatible API secret keys</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6">
          {/* If NOT logged in banner */}
          {!currentUser ? (
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center space-y-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center mx-auto text-emerald-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h3 className="text-sm font-bold text-slate-900">Sign in to generate API Keys</h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
                Registered accounts can generate unlimited personal API secret keys to connect IDEs, Cursor, Telegram bots, and Python scripts.
              </p>
              <button
                onClick={() => { onClose(); if (onOpenAuth) onOpenAuth(); }}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-md cursor-pointer transition-all"
              >
                <LogIn className="w-4 h-4" />
                <span>Sign In / Create Account</span>
              </button>
            </div>
          ) : (
            /* Logged in view */
            <>
              {/* Create Key Form */}
              <form onSubmit={handleCreateKey} className="flex flex-col sm:flex-row gap-2">
                <input
                  type="text"
                  value={newKeyName}
                  onChange={(e) => setNewKeyName(e.target.value)}
                  placeholder="Key name (e.g. My Next.js App, Python Bot, Cursor IDE...)"
                  className="flex-1 px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00d68f]"
                />
                <button
                  type="submit"
                  disabled={!newKeyName.trim()}
                  className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create API Key</span>
                </button>
              </form>

              {/* Keys List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-slate-500 font-bold px-1 uppercase tracking-wider text-[11px]">
                  <span>Active Secret Keys ({keys.length})</span>
                  <span>Requests</span>
                </div>

                {loading ? (
                  <div className="p-6 text-center text-xs text-slate-400">Loading keys...</div>
                ) : keys.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400 bg-slate-50 rounded-2xl border border-slate-200">
                    No API keys created yet. Use the form above to generate your first key.
                  </div>
                ) : (
                  keys.map((k) => (
                    <div
                      key={k.id}
                      className="flex flex-col sm:flex-row sm:items-center justify-between p-3.5 rounded-2xl bg-slate-50 border border-slate-200 hover:border-emerald-300 transition-all gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-slate-900 truncate">{k.name}</span>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-mono font-bold uppercase">
                              {k.status}
                            </span>
                          </div>
                          <div className="font-mono text-[11px] text-slate-500 mt-0.5 truncate select-all">
                            {k.key}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-2 shrink-0 pt-1 sm:pt-0 border-t sm:border-0 border-slate-200">
                        <span className="font-mono text-xs text-slate-700 bg-white px-2.5 py-1 rounded-lg border border-slate-200 font-bold">
                          {k.requestsCount} req
                        </span>
                        <button
                          onClick={() => copyToClipboard(k.key, k.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer border border-slate-200"
                          title="Copy API key"
                        >
                          {copiedKey === k.id ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                        </button>
                        <button
                          onClick={() => handleDeleteKey(k.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer border border-slate-200"
                          title="Revoke & Delete"
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
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <Code2 className="w-4 h-4 text-slate-700" />
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Quick Integration Snippets
              </h3>
            </div>

            {/* Code Tabs */}
            <div className="flex flex-wrap gap-1.5 p-1 bg-slate-100 rounded-full border border-slate-200 w-fit mb-3">
              {(['curl', 'python', 'node', 'cursor'] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold transition-all cursor-pointer ${
                    activeTab === tab
                      ? 'bg-white text-slate-900 shadow-xs font-bold'
                      : 'text-slate-500 hover:text-slate-900'
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
            <div className="relative rounded-2xl overflow-hidden bg-[#0c121e] border border-slate-800">
              <div className="flex items-center justify-between px-3.5 py-2 bg-slate-900 border-b border-slate-800 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-mono text-[11px] text-slate-300">{activeTab} example</span>
                </div>
                <button
                  onClick={() => copyToClipboard(codeSnippets[activeTab], 'snippet')}
                  className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 px-2.5 py-0.5 rounded-lg border border-slate-700 cursor-pointer"
                >
                  {copiedKey === 'snippet' ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{copiedKey === 'snippet' ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <pre className="p-4 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
                <code>{codeSnippets[activeTab]}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
