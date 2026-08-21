'use client';

import React, { useState, useEffect } from 'react';
import { 
  Users, 
  Key, 
  Server, 
  DollarSign, 
  ShieldCheck, 
  Plus, 
  Trash2, 
  RefreshCw, 
  Activity, 
  Cpu, 
  Layers, 
  ArrowLeft, 
  Lock,
  Edit2,
  Check
} from 'lucide-react';
import Link from 'next/link';

interface UserItem {
  id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  balance: number;
  totalSpent: number;
  totalRequests: number;
  status: 'active' | 'suspended';
  createdAt: number;
  apiKeysCount: number;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'providers' | 'nodes'>('users');
  const [authToken, setAuthToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // New Provider/Node forms
  const [newProvider, setNewProvider] = useState('groq');
  const [newProviderKey, setNewProviderKey] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeUrl, setNewNodeUrl] = useState('');
  const [newNodeType, setNewNodeType] = useState('cloudflare');

  // Balance edit modal state
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [addAmount, setAddAmount] = useState('10.00');

  useEffect(() => {
    const savedToken = localStorage.getItem('iportal_auth_token') || '';
    if (savedToken) {
      setAuthToken(savedToken);
      fetchAdminData(savedToken);
    }
  }, []);

  const fetchAdminData = async (token: string) => {
    setLoading(true);
    try {
      const [usersRes, provRes, nodeRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/providers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/nodes', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const usersData = await usersRes.json();
      const provData = await provRes.json();
      const nodeData = await nodeRes.json();

      if (usersData.success) {
        setUsers(usersData.users || []);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      if (provData.success) setProviders(provData.keys || []);
      if (nodeData.success) setNodes(nodeData.nodes || []);
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'admin@iportal.uz', password: adminPassword }),
      });
      const data = await res.json();
      if (data.success && data.user.role === 'admin') {
        localStorage.setItem('iportal_auth_token', data.token);
        setAuthToken(data.token);
        setIsAuthenticated(true);
        fetchAdminData(data.token);
      } else {
        setLoginError(data.error || 'Noto\'g\'ri admin paroli');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Xatolik');
    }
  };

  const handleAddBalance = async (userId: string) => {
    try {
      const res = await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId,
          addBalance: parseFloat(addAmount),
        }),
      });
      const data = await res.json();
      if (data.success) {
        setEditingUserId(null);
        fetchAdminData(authToken);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleToggleUserStatus = async (user: UserItem) => {
    const nextStatus = user.status === 'active' ? 'suspended' : 'active';
    try {
      await fetch('/api/admin/users', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          userId: user.id,
          status: nextStatus,
        }),
      });
      fetchAdminData(authToken);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('Ushbu foydalanuvchini o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await fetch(`/api/admin/users?userId=${userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchAdminData(authToken);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProviderKey.trim()) return;
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ provider: newProvider, key: newProviderKey.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewProviderKey('');
        fetchAdminData(authToken);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteProviderKey = async (id: string) => {
    if (!confirm('Ushbu provayder kalitini o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await fetch(`/api/providers?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchAdminData(authToken);
    } catch (e) {
      console.error(e);
    }
  };

  const handleAddNode = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newNodeUrl.trim()) return;
    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          name: newNodeName.trim() || `Node (${newNodeType})`,
          url: newNodeUrl.trim(),
          type: newNodeType,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setNewNodeName('');
        setNewNodeUrl('');
        fetchAdminData(authToken);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Ushbu nodeni o\'chirishni tasdiqlaysizmi?')) return;
    try {
      await fetch(`/api/nodes?id=${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchAdminData(authToken);
    } catch (e) {
      console.error(e);
    }
  };

  const handlePingNodes = async () => {
    try {
      await fetch('/api/nodes', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      fetchAdminData(authToken);
    } catch (e) {
      console.error(e);
    }
  };

  // Login Screen if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#080b12] text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-[#0f1422] border border-[#1e293f] shadow-2xl space-y-4">
          <div className="text-center space-y-1.5">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-base font-bold text-white">iportal-ai Admin Panel</h1>
            <p className="text-xs text-gray-400">Tizimni boshqarish uchun admin parolini kiriting</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-3">
            {loginError && (
              <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/40 text-xs text-red-300">
                {loginError}
              </div>
            )}
            <input
              type="password"
              required
              value={adminPassword}
              onChange={(e) => setAdminPassword(e.target.value)}
              placeholder="Admin Paroli (default: admin12345)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
            />
            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              Admin Paneligа Kirish
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-blue-400 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bosh sahifaga qaytish</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const totalUsers = users.length;
  const totalBalance = users.reduce((acc, u) => acc + u.balance, 0).toFixed(2);
  const totalSpent = users.reduce((acc, u) => acc + u.totalSpent, 0).toFixed(2);
  const totalRequests = users.reduce((acc, u) => acc + u.totalRequests, 0);

  return (
    <div className="min-h-screen w-screen bg-[#080b12] text-gray-100 font-sans flex flex-col">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#1a2336] bg-[#0c101c] px-4 md:px-8 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#182136]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <h1 className="font-bold text-sm text-white">iportal-ai Boshqaruv Markazi (Admin)</h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => fetchAdminData(authToken)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#141c2c] hover:bg-[#1f2b44] text-xs text-gray-300 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </header>

      {/* Main Stats Row */}
      <div className="max-w-6xl w-full mx-auto p-4 md:p-6 space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1e293f] space-y-1">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Foydalanuvchilar</span>
              <Users className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-xl font-bold text-white">{totalUsers}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1e293f] space-y-1">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Mavjud Balanslar</span>
              <DollarSign className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-xl font-bold text-emerald-400">${totalBalance}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1e293f] space-y-1">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Sarflangan Qiymat</span>
              <DollarSign className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-xl font-bold text-white">${totalSpent}</div>
          </div>

          <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1e293f] space-y-1">
            <div className="flex items-center justify-between text-gray-400 text-xs">
              <span>Jami So'rovlar</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-xl font-bold text-white">{totalRequests} req</div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-[#1e293f] bg-[#0c101c] rounded-xl p-1 w-fit">
          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'users' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Foydalanuvchilar & Balanslar ({users.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'providers' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Cpu className="w-4 h-4" />
            <span>AI Provayder Kalitlari ({providers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              activeTab === 'nodes' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>Edge Hosting Nodelari ({nodes.length})</span>
          </button>
        </div>

        {/* Tab 1: Users & Balances */}
        {activeTab === 'users' && (
          <div className="space-y-4">
            <div className="bg-[#0f1422] border border-[#1e293f] rounded-2xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#141a29] border-b border-[#1e293f] text-gray-400">
                    <tr>
                      <th className="p-3.5">Foydalanuvchi</th>
                      <th className="p-3.5">Email</th>
                      <th className="p-3.5">Roli</th>
                      <th className="p-3.5">Balans</th>
                      <th className="p-3.5">So'rovlar</th>
                      <th className="p-3.5">Holati</th>
                      <th className="p-3.5 text-right">Amallar</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#182136]">
                    {users.map((u) => (
                      <tr key={u.id} className="hover:bg-[#121828] transition-colors">
                        <td className="p-3.5 font-semibold text-white">{u.name}</td>
                        <td className="p-3.5 font-mono text-gray-300">{u.email}</td>
                        <td className="p-3.5">
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            u.role === 'admin' ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30' : 'bg-blue-500/10 text-blue-400'
                          }`}>
                            {u.role}
                          </span>
                        </td>
                        <td className="p-3.5 font-mono font-bold text-emerald-400">
                          ${u.balance.toFixed(2)}
                        </td>
                        <td className="p-3.5 font-mono text-gray-400">{u.totalRequests} req</td>
                        <td className="p-3.5">
                          <button
                            onClick={() => handleToggleUserStatus(u)}
                            className={`px-2 py-0.5 rounded text-[10px] font-semibold cursor-pointer ${
                              u.status === 'active' ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'
                            }`}
                          >
                            {u.status}
                          </button>
                        </td>
                        <td className="p-3.5 text-right space-x-1">
                          <button
                            onClick={() => setEditingUserId(u.id)}
                            className="px-2 py-1 rounded bg-[#1a2336] hover:bg-blue-600 text-gray-200 hover:text-white transition-colors cursor-pointer"
                            title="Balans to'ldirish"
                          >
                            <DollarSign className="w-3.5 h-3.5 inline" /> +Balans
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleDeleteUser(u.id)}
                              className="p-1 rounded bg-[#1a2336] hover:bg-red-950 text-gray-400 hover:text-red-400 transition-colors cursor-pointer"
                              title="O'chirish"
                            >
                              <Trash2 className="w-3.5 h-3.5 inline" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal for adding balance */}
            {editingUserId && (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                <div className="w-full max-w-sm p-5 rounded-2xl bg-[#0f1422] border border-[#232f48] shadow-2xl space-y-4">
                  <h3 className="text-sm font-bold text-white">Balans Qo'shish ($ USD)</h3>
                  <input
                    type="number"
                    step="1"
                    value={addAmount}
                    onChange={(e) => setAddAmount(e.target.value)}
                    placeholder="Masalan: 10.00"
                    className="w-full px-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-white focus:outline-none focus:border-blue-500"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => setEditingUserId(null)}
                      className="px-3 py-1.5 rounded-lg text-xs text-gray-400 hover:text-white"
                    >
                      Bekor qilish
                    </button>
                    <button
                      onClick={() => handleAddBalance(editingUserId)}
                      className="px-4 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-md cursor-pointer"
                    >
                      Balansga Qo'shish
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Provider Keys (Admin Only) */}
        {activeTab === 'providers' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1e293f] space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Yangi Bepul AI Kalit Qo'shish (Faqat Admin Ko'radi)
              </div>
              <form onSubmit={handleAddProviderKey} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  value={newProvider}
                  onChange={(e) => setNewProvider(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-200"
                >
                  <option value="groq">Groq Cloud (Llama 3.3 70B)</option>
                  <option value="gemini">Google Gemini 2.0 / 1.5</option>
                  <option value="sambanova">SambaNova (DeepSeek R1 70B)</option>
                  <option value="cerebras">Cerebras (Llama 3.1 70B)</option>
                  <option value="openrouter">OpenRouter Free</option>
                  <option value="mistral">Mistral AI Free</option>
                  <option value="cloudflare">Cloudflare Workers AI</option>
                  <option value="huggingface">Hugging Face Serverless</option>
                </select>
                <input
                  type="password"
                  value={newProviderKey}
                  onChange={(e) => setNewProviderKey(e.target.value)}
                  placeholder="API Kalit (gsk_..., AIzaSy...)"
                  className="sm:col-span-2 px-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-200 placeholder-gray-500"
                />
                <div className="sm:col-span-3 flex justify-end pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Kalitni Saqlash</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              {providers.map((pk) => (
                <div key={pk.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0f1422] border border-[#1e293f]">
                  <div className="flex items-center gap-3">
                    <Cpu className="w-4 h-4 text-purple-400" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-white uppercase">{pk.provider}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
                          {pk.status}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-gray-400">{pk.maskedKey}</span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteProviderKey(pk.id)}
                    className="p-1.5 rounded-lg bg-[#182136] hover:bg-red-950 text-gray-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab 3: Edge Worker Nodes (Admin Only) */}
        {activeTab === 'nodes' && (
          <div className="space-y-5">
            <div className="p-4 rounded-xl bg-[#0f1422] border border-[#1e293f] space-y-3">
              <div className="text-xs font-bold text-white uppercase tracking-wider">
                Yangi Edge Hosting Node Qo'shish
              </div>
              <form onSubmit={handleAddNode} className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  type="text"
                  value={newNodeName}
                  onChange={(e) => setNewNodeName(e.target.value)}
                  placeholder="Node nomi (Cloudflare 1...)"
                  className="px-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-200"
                />
                <input
                  type="url"
                  value={newNodeUrl}
                  onChange={(e) => setNewNodeUrl(e.target.value)}
                  placeholder="https://iportal-proxy.workers.dev"
                  className="px-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-200"
                />
                <select
                  value={newNodeType}
                  onChange={(e) => setNewNodeType(e.target.value)}
                  className="px-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-200"
                >
                  <option value="cloudflare">Cloudflare Worker</option>
                  <option value="deno">Deno Deploy</option>
                  <option value="vercel">Vercel Edge</option>
                  <option value="netlify">Netlify Edge</option>
                  <option value="render">Render / Koyeb</option>
                </select>
                <div className="sm:col-span-3 flex justify-between items-center pt-1">
                  <button
                    type="button"
                    onClick={handlePingNodes}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#182136] hover:bg-[#232f4a] text-cyan-300 text-xs font-medium cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ping Sinash</span>
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-medium text-xs shadow-md cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Node Qo'shish</span>
                  </button>
                </div>
              </form>
            </div>

            <div className="space-y-2">
              {nodes.map((n) => (
                <div key={n.id} className="flex items-center justify-between p-3.5 rounded-xl bg-[#0f1422] border border-[#1e293f]">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${n.status === 'online' ? 'bg-green-500' : 'bg-yellow-500'}`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white">{n.name}</span>
                        <span className="text-[10px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#182136] text-gray-300">
                          {n.type}
                        </span>
                      </div>
                      <span className="font-mono text-xs text-gray-400">{n.url}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {n.latencyMs !== undefined && (
                      <span className="font-mono text-xs text-cyan-400 bg-[#141a29] px-2 py-1 rounded">
                        {n.latencyMs}ms
                      </span>
                    )}
                    <button
                      onClick={() => handleDeleteNode(n.id)}
                      className="p-1.5 rounded-lg bg-[#182136] hover:bg-red-950 text-gray-400 hover:text-red-400"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
