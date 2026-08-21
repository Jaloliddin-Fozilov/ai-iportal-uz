'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  Server, 
  Plus, 
  Trash2, 
  Zap, 
  ShieldCheck, 
  Activity, 
  KeyRound, 
  Layers, 
  RefreshCw,
  Cpu
} from 'lucide-react';
import { ProviderId, ProviderKeyItem, WorkerNode } from '@/lib/core/types';

interface ClusterMeshModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClusterMeshModal: React.FC<ClusterMeshModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'nodes' | 'providers'>('nodes');
  
  // Nodes state
  const [nodes, setNodes] = useState<WorkerNode[]>([]);
  const [nodeName, setNodeName] = useState('');
  const [nodeUrl, setNodeUrl] = useState('');
  const [nodeType, setNodeType] = useState<WorkerNode['type']>('cloudflare');
  const [nodeSecret, setNodeSecret] = useState('');
  const [isPinging, setIsPinging] = useState(false);

  // Providers state
  const [providerKeys, setProviderKeys] = useState<ProviderKeyItem[]>([]);
  const [selectedProvider, setSelectedProvider] = useState<ProviderId>('groq');
  const [newKeyString, setNewKeyString] = useState('');
  const [testingKeyId, setTestingKeyId] = useState<string | null>(null);

  const fetchClusterData = async () => {
    try {
      const [nodesRes, providersRes] = await Promise.all([
        fetch('/api/nodes'),
        fetch('/api/providers'),
      ]);
      const nodesData = await nodesRes.json();
      const providersData = await providersRes.json();

      if (nodesData.success) setNodes(nodesData.nodes || []);
      if (providersData.success) setProviderKeys(providersData.keys || []);
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchClusterData();
    }
  }, [isOpen]);

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeUrl.trim()) return;

    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: nodeName.trim() || `Node (${nodeType})`,
          url: nodeUrl.trim(),
          type: nodeType,
          secret: nodeSecret.trim() || undefined,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNodes([...nodes, data.node]);
        setNodeName('');
        setNodeUrl('');
        setNodeSecret('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Ushbu hosting nodeni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      const res = await fetch(`/api/nodes?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setNodes(nodes.filter(n => n.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handlePingAllNodes = async () => {
    setIsPinging(true);
    try {
      const res = await fetch('/api/nodes', { method: 'PUT' });
      const data = await res.json();
      if (data.success && data.nodes) {
        setNodes(data.nodes);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsPinging(false);
    }
  };

  const handleAddProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyString.trim()) return;

    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: selectedProvider,
          key: newKeyString.trim(),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProviderKeys([...providerKeys, data.keyItem]);
        setNewKeyString('');
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProviderKey = async (id: string) => {
    if (!confirm('Ushbu provayder kalitini o\'chirishni tasdiqlaysizmi?')) return;
    try {
      const res = await fetch(`/api/providers?id=${id}`, { method: 'DELETE' });
      const data = await res.json();
      if (data.success) {
        setProviderKeys(providerKeys.filter(k => k.id !== id));
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleTestProvider = async (providerId: ProviderId, keyId: string) => {
    setTestingKeyId(keyId);
    try {
      const res = await fetch('/api/providers', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ providerId }),
      });
      const data = await res.json();
      if (data.success) {
        alert(`Muvaffaqiyatli! Provayder ${providerId} javob berdi (${data.latencyMs} ms)`);
      } else {
        alert(`Xatolik (${providerId}): ${data.error}`);
      }
      fetchClusterData();
    } catch (e: any) {
      alert(`Xatolik: ${e.message}`);
    } finally {
      setTestingKeyId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[90vh] bg-[#0d121f] border border-[#232f48] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-5 border-b border-[#1e293f] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Taqsimlangan Hosting & AI Klaster Mesh</h2>
              <p className="text-xs text-gray-400">Bepul hosting IP-lari va Bepul AI provayderlar rotatsiyasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2336] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-[#1e293f] bg-[#0a0e1a] px-5 pt-2">
          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'nodes'
                ? 'border-cyan-400 text-cyan-300 bg-[#121828]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Bepul Hosting Node Proxylari ({nodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              activeTab === 'providers'
                ? 'border-cyan-400 text-cyan-300 bg-[#121828]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <KeyRound className="w-4 h-4" />
            <span>AI Provayder Kalitlari ({providerKeys.length})</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {activeTab === 'nodes' ? (
            /* TAB 1: WORKER NODES */
            <div className="space-y-5">
              {/* Info banner */}
              <div className="p-3.5 rounded-xl bg-blue-950/30 border border-blue-800/30 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
                <div className="text-xs text-blue-200/90 leading-relaxed">
                  <strong>Nega ko'p bepul hosting kerak?</strong> Bepul AI provayderlar bitta server IP sidan ko'p kalit bilan so'rov tushganda bloklaydi. Cloudflare Workers, Deno Deploy, Vercel Edge va boshqa bepul serverlar orqali so'rovlar har xil IP lardan o'tadi va 100% cheklovsiz ishlaydi.
                </div>
              </div>

              {/* Add Node Form */}
              <form onSubmit={handleAddNode} className="p-4 rounded-xl bg-[#121726] border border-[#1e293f] space-y-3">
                <div className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Yangi Edge Hosting Node Qo'shish
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <input
                    type="text"
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    placeholder="Node nomi (masalan: Cloudflare Worker 1)"
                    className="px-3 py-2 rounded-lg bg-[#0d121f] border border-[#232f48] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <input
                    type="url"
                    value={nodeUrl}
                    onChange={(e) => setNodeUrl(e.target.value)}
                    placeholder="Worker URL (https://my-proxy.workers.dev)"
                    required
                    className="px-3 py-2 rounded-lg bg-[#0d121f] border border-[#232f48] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <select
                    value={nodeType}
                    onChange={(e) => setNodeType(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-[#0d121f] border border-[#232f48] text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="cloudflare">Cloudflare Workers</option>
                    <option value="deno">Deno Deploy</option>
                    <option value="vercel">Vercel Edge</option>
                    <option value="netlify">Netlify Edge</option>
                    <option value="render">Render / Koyeb</option>
                    <option value="custom">Boshqa Hosting</option>
                  </select>
                </div>
                <div className="flex items-center justify-between pt-1">
                  <input
                    type="password"
                    value={nodeSecret}
                    onChange={(e) => setNodeSecret(e.target.value)}
                    placeholder="X-Proxy-Secret (ixtiyoriy, default: iportal-proxy-secret-token)"
                    className="w-full sm:w-1/2 px-3 py-1.5 rounded-lg bg-[#0d121f] border border-[#232f48] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Node Qo'shish</span>
                  </button>
                </div>
              </form>

              {/* Nodes List */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-xs font-semibold text-gray-400">
                    Ulangan Hosting Nodelar ({nodes.length})
                  </div>
                  <button
                    onClick={handlePingAllNodes}
                    disabled={isPinging || nodes.length === 0}
                    className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-[#182136] hover:bg-[#23304c] text-cyan-300 text-xs font-medium border border-[#2b3a58] transition-all cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isPinging ? 'animate-spin' : ''}`} />
                    <span>{isPinging ? 'Sinov o\'tkazilmoqda...' : 'Barchasini Sinash (Ping)'}</span>
                  </button>
                </div>

                {nodes.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-[#121726] rounded-xl border border-[#1e293f]">
                    Hozircha tashqi worker nodelar ulanmagan. Tizim to'g'ridan-to'g'ri (Direct Mode) rejimda ishlamoqda.
                    <br />
                    <span className="text-cyan-400 font-mono text-[11px] mt-1 block">
                      workers/ papkasidagi tayyor skriptni Cloudflare yoki Deno ga 1 bosishda joylab bu yerga URL ini kiriting.
                    </span>
                  </div>
                ) : (
                  nodes.map((n) => (
                    <div
                      key={n.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121726] border border-[#1e293f] hover:border-[#2b3a58] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                          n.status === 'online' ? 'bg-green-500 shadow-green-500/50 shadow-sm' :
                          n.status === 'degraded' ? 'bg-yellow-500' : 'bg-red-500'
                        }`} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-xs text-white">{n.name}</span>
                            <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#1a2336] text-gray-300 border border-[#2b3852]">
                              {n.type}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-gray-400 truncate select-all">
                            {n.url}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        {n.latencyMs !== undefined && (
                          <div className="flex items-center gap-1 font-mono text-xs text-cyan-400 bg-[#0d121f] px-2 py-1 rounded border border-[#1e293f]">
                            <Activity className="w-3 h-3" />
                            <span>{n.latencyMs}ms</span>
                          </div>
                        )}
                        <button
                          onClick={() => handleDeleteNode(n.id)}
                          className="p-1.5 rounded-lg bg-[#1a2236] hover:bg-red-950/50 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ) : (
            /* TAB 2: AI PROVIDERS */
            <div className="space-y-5">
              {/* Add Provider Key Form */}
              <form onSubmit={handleAddProviderKey} className="p-4 rounded-xl bg-[#121726] border border-[#1e293f] space-y-3">
                <div className="text-xs font-bold text-gray-200 uppercase tracking-wider">
                  Yangi Bepul AI Provayder Kaliti Qo'shish
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <select
                    value={selectedProvider}
                    onChange={(e) => setSelectedProvider(e.target.value as any)}
                    className="px-3 py-2 rounded-lg bg-[#0d121f] border border-[#232f48] text-xs text-gray-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="groq">Groq Cloud (Llama 3.3 70B)</option>
                    <option value="gemini">Google Gemini 2.0 / 1.5</option>
                    <option value="sambanova">SambaNova (DeepSeek R1 70B)</option>
                    <option value="cerebras">Cerebras (Llama 3.1 70B)</option>
                    <option value="openrouter">OpenRouter Free Tier</option>
                    <option value="mistral">Mistral AI Free</option>
                    <option value="cloudflare">Cloudflare Workers AI</option>
                    <option value="huggingface">Hugging Face Serverless</option>
                  </select>

                  <input
                    type="password"
                    value={newKeyString}
                    onChange={(e) => setNewKeyString(e.target.value)}
                    placeholder="API Kalit (masalan: gsk_..., AIzaSy...)"
                    required
                    className="sm:col-span-2 px-3 py-2 rounded-lg bg-[#0d121f] border border-[#232f48] text-xs text-gray-200 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div className="flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-medium text-xs shadow-md transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Kalitni Saqlash</span>
                  </button>
                </div>
              </form>

              {/* Provider Keys List */}
              <div className="space-y-2">
                <div className="text-xs font-semibold text-gray-400">
                  Faol Bepul AI Provayder Kalitlari ({providerKeys.length})
                </div>

                {providerKeys.length === 0 ? (
                  <div className="p-6 text-center text-xs text-gray-400 bg-[#121726] rounded-xl border border-[#1e293f]">
                    Hozircha provayder kaliti kiritilmagan. .env faylida (GROQ_API_KEYS, GEMINI_API_KEYS) yoki yuqoridagi formadan qo'shing.
                  </div>
                ) : (
                  providerKeys.map((pk) => (
                    <div
                      key={pk.id}
                      className="flex items-center justify-between p-3 rounded-xl bg-[#121726] border border-[#1e293f] hover:border-[#2b3a58] transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Cpu className="w-4 h-4 text-purple-400 shrink-0" />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-xs text-white uppercase">{pk.provider}</span>
                            <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono ${
                              pk.status === 'active'
                                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                                : 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20'
                            }`}>
                              {pk.status}
                            </span>
                          </div>
                          <div className="font-mono text-xs text-gray-400 mt-0.5">
                            {pk.maskedKey}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => handleTestProvider(pk.provider, pk.id)}
                          disabled={testingKeyId === pk.id}
                          className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#182136] hover:bg-[#23304c] text-blue-300 text-xs font-medium border border-[#2b3a58] transition-all cursor-pointer disabled:opacity-50"
                        >
                          <Zap className={`w-3 h-3 ${testingKeyId === pk.id ? 'animate-spin text-amber-400' : ''}`} />
                          <span>{testingKeyId === pk.id ? 'Tekshirilmoqda...' : 'Sinash'}</span>
                        </button>
                        <button
                          onClick={() => handleDeleteProviderKey(pk.id)}
                          className="p-1.5 rounded-lg bg-[#1a2236] hover:bg-red-950/50 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
