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
  Check,
  BarChart3,
  Globe,
  Zap,
  Clock,
  CheckCircle2,
  XCircle,
  TrendingUp,
  Brain,
  Code,
  Stethoscope,
  AlertTriangle,
  HardDrive,
  Radio,
  Copy,
  FileText,
  Upload,
  Sparkles,
  Terminal,
  Play
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

interface StatsData {
  totalRequests: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalTokens: number;
  providers: Record<string, {
    provider: string;
    name: string;
    requestsCount: number;
    successCount: number;
    failCount: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    lastUsedAt?: number;
  }>;
  nodes: Record<string, {
    id: string;
    name: string;
    type: string;
    url: string;
    requestsCount: number;
    successCount: number;
    failCount: number;
    latencyMs?: number;
    lastUsedAt?: number;
    status: 'online' | 'degraded' | 'offline';
  }>;
  models: Record<string, {
    model: string;
    requestsCount: number;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    lastUsedAt?: number;
  }>;
  recentLogs: {
    id: string;
    timestamp: number;
    provider: string;
    node?: string;
    model: string;
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    latencyMs?: number;
    status: 'success' | 'error';
    errorMessage?: string;
  }[];
}

interface KeyQuotaItem {
  keyId: string;
  provider: string;
  providerName: string;
  maskedKey: string;
  status: string;
  usedRequests: number;
  usedTokens: number;
  dailyRequestsLimit: number;
  remainingRequests: number;
  dailyTokensLimit: number;
  remainingTokens: number;
  percentRemaining: number;
  healthStatus: 'healthy' | 'warning' | 'exhausted' | 'error';
  resetInfo: string;
}

interface HealthSummaryData {
  totalDailyCapacity: number;
  totalRemainingRequests: number;
  totalTokensCapacity: number;
  totalRemainingTokens: number;
  overallHealthPercent: number;
  activeKeysCount: number;
  activeNodesCount: number;
  systemInfo?: {
    uptimeSeconds: number;
    nodeVersion: string;
    memoryUsageMb: number;
    totalMemoryMb: number;
    platform: string;
    arch: string;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'stats' | 'health' | 'nodes' | 'providers' | 'users'>('stats');
  const [authToken, setAuthToken] = useState<string>('');
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [adminPassword, setAdminPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);

  // Data state
  const [users, setUsers] = useState<UserItem[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [nodes, setNodes] = useState<any[]>([]);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [keyQuotas, setKeyQuotas] = useState<KeyQuotaItem[]>([]);
  const [healthSummary, setHealthSummary] = useState<HealthSummaryData | null>(null);
  const [loading, setLoading] = useState(false);
  const [probing, setProbing] = useState(false);

  // New Provider/Node forms
  const [newProvider, setNewProvider] = useState('groq');
  const [newProviderKey, setNewProviderKey] = useState('');
  const [newNodeName, setNewNodeName] = useState('');
  const [newNodeUrl, setNewNodeUrl] = useState('');
  const [newNodeType, setNewNodeType] = useState('vercel');

  // Bulk state
  const [providerInputMode, setProviderInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkProviderKeysText, setBulkProviderKeysText] = useState('');
  const [bulkProviderMessage, setBulkProviderMessage] = useState<string | null>(null);

  const [nodeInputMode, setNodeInputMode] = useState<'single' | 'bulk'>('single');
  const [bulkNodesText, setBulkNodesText] = useState('');
  const [bulkNodeMessage, setBulkNodeMessage] = useState<string | null>(null);
  const [activeCodeTab, setActiveCodeTab] = useState<'vercel' | 'cloudflare' | 'deno' | 'docker'>('vercel');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [pingingAllNodes, setPingingAllNodes] = useState(false);

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
      const [usersRes, provRes, nodeRes, statsRes, healthRes] = await Promise.all([
        fetch('/api/admin/users', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/providers', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/nodes', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/stats', { headers: { Authorization: `Bearer ${token}` } }),
        fetch('/api/admin/health-check', { headers: { Authorization: `Bearer ${token}` } }),
      ]);

      const usersData = await usersRes.json();
      const provData = await provRes.json();
      const nodeData = await nodeRes.json();
      const statsData = await statsRes.json();
      const healthData = await healthRes.json();

      if (usersData.success) {
        setUsers(usersData.users || []);
        setIsAuthenticated(true);
      } else {
        setIsAuthenticated(false);
      }

      if (provData.success) setProviders(provData.keys || []);
      if (nodeData.success) setNodes(nodeData.nodes || []);
      if (statsData.success) setStats(statsData.stats || null);
      if (healthData.success) {
        setKeyQuotas(healthData.keyQuotas || []);
        setHealthSummary({
          ...healthData.summary,
          systemInfo: healthData.systemInfo,
        });
      }
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleRunHealthProbe = async () => {
    setProbing(true);
    try {
      const res = await fetch('/api/admin/health-check', {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        alert('Jonli salomatlik diagnostikasi muvaffaqiyatli yakunlandi!');
        fetchAdminData(authToken);
      }
    } catch (e: any) {
      alert(`Diagnostika xatosi: ${e.message}`);
    } finally {
      setProbing(false);
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
        body: JSON.stringify({
          provider: newProvider,
          key: newProviderKey.trim(),
        }),
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

  const handleBulkAddProviderKeys = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkProviderKeysText.trim()) return;
    setBulkProviderMessage(null);
    try {
      const res = await fetch('/api/providers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          provider: newProvider,
          bulkText: bulkProviderKeysText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkProviderMessage(`✨ ${data.totalAdded} ta yangi kalit qo'shildi (${data.totalSkipped} ta dublikat o'tkazib yuborildi)`);
        setBulkProviderKeysText('');
        fetchAdminData(authToken);
      } else {
        setBulkProviderMessage(`❌ Xatolik: ${data.error}`);
      }
    } catch (e: any) {
      setBulkProviderMessage(`❌ Xatolik: ${e.message}`);
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
          name: newNodeName.trim() || `Edge Node (${newNodeType})`,
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

  const handleBulkAddNodes = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkNodesText.trim()) return;
    setBulkNodeMessage(null);
    try {
      const res = await fetch('/api/nodes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          bulkText: bulkNodesText,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setBulkNodeMessage(`✨ ${data.totalAdded} ta yangi edge hosting ulandi (${data.totalSkipped} ta dublikat o'tkazib yuborildi)`);
        setBulkNodesText('');
        fetchAdminData(authToken);
      } else {
        setBulkNodeMessage(`❌ Xatolik: ${data.error}`);
      }
    } catch (e: any) {
      setBulkNodeMessage(`❌ Xatolik: ${e.message}`);
    }
  };

  const handleDeleteNode = async (id: string) => {
    if (!confirm('Ushbu hosting nodeni o\'chirishni tasdiqlaysizmi?')) return;
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

  const handlePingNode = async (url: string) => {
    try {
      const res = await fetch('/api/health/ping', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      alert(`Node Holati: ${data.status}\nKechikish: ${data.latencyMs ? `${data.latencyMs} ms` : 'N/A'}`);
      fetchAdminData(authToken);
    } catch (e) {
      alert('Node bilan bog\'lanib bo\'lmadi');
    }
  };

  const handlePingAllNodes = async () => {
    setPingingAllNodes(true);
    try {
      const res = await fetch('/api/nodes', {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (data.success) {
        fetchAdminData(authToken);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setPingingAllNodes(false);
    }
  };

  const handleCopyCodeSnippet = (code: string, id: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(id);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // Login Screen
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#edf3f0] flex items-center justify-center p-4">
        <div className="w-full max-w-md bg-white border border-[#dce8e2] rounded-3xl p-8 shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-[#00d68f] text-slate-950 flex items-center justify-center mx-auto shadow-md">
              <Lock className="w-6 h-6 stroke-[2.2]" />
            </div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">iportal-ai Admin Panel</h1>
            <p className="text-xs text-slate-500">Tizim va statistikani boshqarish uchun admin parolini kiriting</p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            {loginError && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium">
                {loginError}
              </div>
            )}
            <div>
              <input
                type="password"
                required
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                placeholder="Admin parolini kiriting..."
                className="w-full px-4 py-3 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00d68f]"
              />
            </div>
            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer"
            >
              Admin Paneliga Kirish
            </button>
          </form>

          <div className="text-center">
            <Link href="/" className="text-xs text-slate-500 hover:text-slate-800 transition-colors">
              ← Bosh sahifaga qaytish
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#edf3f0] text-slate-900 font-sans p-3 sm:p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-[#dce8e2] shadow-sm">
          <div className="flex items-center gap-3">
            <Link href="/" className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors">
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <div>
              <h1 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                <span>iportal-ai Boshqaruv & Tahlil Markazi</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-bold">
                  v1.0 LIVE
                </span>
              </h1>
              <p className="text-xs text-slate-500">
                AI Klasteri, Edge Proxy Nodelar, Token Sarfi, Health Checker & Quota Tahlili
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => fetchAdminData(authToken)}
              disabled={loading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-all cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              <span>Yangilash</span>
            </button>
            <Link
              href="/mail"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 text-xs font-bold transition-all"
            >
              <span>Maxfiy Webmail</span>
            </Link>
          </div>
        </div>

        {/* Global Summary KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dce8e2] shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Kunlik Qolgan So'rov</span>
              <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                <TrendingUp className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {(healthSummary?.totalRemainingRequests ?? 14400).toLocaleString()}{' '}
              <span className="text-xs font-normal text-slate-400">/ {(healthSummary?.totalDailyCapacity ?? 14400).toLocaleString()}</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              Klaster salomatligi: {healthSummary?.overallHealthPercent ?? 100}%
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dce8e2] shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Jami Token Sarfi</span>
              <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                <Cpu className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {(stats?.totalTokens ?? 0).toLocaleString()}
            </div>
            <div className="text-[11px] text-slate-400">
              Qolgan bepul tokenlar: ~{(healthSummary?.totalRemainingTokens ?? 1000000).toLocaleString()}
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dce8e2] shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Provayderlar</span>
              <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                <Key className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {providers.length} <span className="text-sm font-normal text-slate-400">kalit</span>
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold">
              8 ta erkin AI zaxirasi ulangan
            </div>
          </div>

          <div className="p-4 sm:p-5 rounded-3xl bg-white border border-[#dce8e2] shadow-sm space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Edge Nodelar</span>
              <div className="p-2 rounded-xl bg-cyan-50 text-cyan-600">
                <Server className="w-4 h-4" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
              {nodes.length} <span className="text-sm font-normal text-slate-400">node</span>
            </div>
            <div className="text-[11px] text-slate-500 font-medium">
              VDS IP to'liq yashirilgan
            </div>
          </div>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1.5 p-1.5 bg-white rounded-2xl border border-[#dce8e2] w-fit shadow-xs flex-wrap">
          <button
            onClick={() => setActiveTab('stats')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'stats'
                ? 'bg-[#00d68f] text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            <span>Statistika & Tahlil</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'health'
                ? 'bg-[#00d68f] text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Stethoscope className="w-4 h-4" />
            <span>Health Checker & Quota ({keyQuotas.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('nodes')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'nodes'
                ? 'bg-[#00d68f] text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>Edge Hosting Nodelari ({nodes.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('providers')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'providers'
                ? 'bg-[#00d68f] text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Key className="w-4 h-4" />
            <span>AI Provayder Kalitlari ({providers.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('users')}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
              activeTab === 'users'
                ? 'bg-[#00d68f] text-slate-950 shadow-sm'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Foydalanuvchilar ({users.length})</span>
          </button>
        </div>

        {/* TAB 1: DETAILED STATS & ANALYTICS */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Providers Breakdown Table */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    AI Provayderlar Bo'yicha So'rovlar & Token Sarfi
                  </h2>
                  <p className="text-xs text-slate-500">
                    Qaysi AI provayderga qancha so'rov yo'naltirildi va qancha token sarflandi
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-3">Provayder</th>
                      <th className="py-3 px-3">Jami So'rovlar</th>
                      <th className="py-3 px-3">Muvaffaqiyatli / Xato</th>
                      <th className="py-3 px-3">Prompt Token</th>
                      <th className="py-3 px-3">Completion Token</th>
                      <th className="py-3 px-3">Jami Tokenlar</th>
                      <th className="py-3 px-3">Oxirgi Ishlatilgan</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats && Object.values(stats.providers).length > 0 ? (
                      Object.values(stats.providers).map((p) => (
                        <tr key={p.provider} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">{p.name}</div>
                            <div className="font-mono text-[11px] text-slate-400">{p.provider}</div>
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                            {p.requestsCount}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-emerald-600 font-semibold">{p.successCount} ok</span>
                            {p.failCount > 0 && (
                              <span className="text-red-500 font-semibold ml-1.5">({p.failCount} err)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">
                            {p.promptTokens.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-slate-600">
                            {p.completionTokens.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-purple-700">
                            {p.totalTokens.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                            {p.lastUsedAt ? new Date(p.lastUsedAt).toLocaleTimeString() : '—'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Hozircha ma'lumotlar yozilmadi.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Edge Hosting Nodes Analytics Table */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    Edge Hosting Nodelari Bo'yicha Zaproslar & Kechikish (Latency)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Outbound so'rovlar qaysi hosting orqali yo'naltirildi va VDS IP qanday himoyalandi
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-3">Node Nomi & Turi</th>
                      <th className="py-3 px-3">Proxy Endpoint URL</th>
                      <th className="py-3 px-3">Yo'naltirilgan So'rovlar</th>
                      <th className="py-3 px-3">Muvaffaqiyat / Xatolik</th>
                      <th className="py-3 px-3">Kechikish (Latency)</th>
                      <th className="py-3 px-3">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {nodes.map((node) => {
                      const stat = stats?.nodes[node.name] || stats?.nodes[node.url];
                      return (
                        <tr key={node.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-3">
                            <div className="font-bold text-slate-900">{node.name}</div>
                            <span className="text-[10px] px-1.5 py-0.2 rounded bg-slate-100 text-slate-600 font-mono uppercase">
                              {node.type}
                            </span>
                          </td>
                          <td className="py-3.5 px-3 font-mono text-[11px] text-slate-500 select-all max-w-xs truncate">
                            {node.url}
                          </td>
                          <td className="py-3.5 px-3 font-mono font-bold text-slate-900">
                            {stat?.requestsCount || 0} req
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="text-emerald-600 font-semibold">{stat?.successCount || 0} ok</span>
                            {(stat?.failCount || 0) > 0 && (
                              <span className="text-red-500 font-semibold ml-1">({stat?.failCount} err)</span>
                            )}
                          </td>
                          <td className="py-3.5 px-3 font-mono text-cyan-600 font-bold">
                            {stat?.latencyMs ? `${stat.latencyMs} ms` : node.latencyMs ? `${node.latencyMs} ms` : '—'}
                          </td>
                          <td className="py-3.5 px-3">
                            <span className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 font-bold border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              ONLINE
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Recent Live Request Logs */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight">
                    So'nggi Jonli So'rovlar Jurnali (Live Requests Log)
                  </h2>
                  <p className="text-xs text-slate-500">
                    Klasterga kelgan real-time so'rovlar, ularning token sarfi va kechikishi
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-3">Vaqt</th>
                      <th className="py-3 px-3">Model</th>
                      <th className="py-3 px-3">AI Provayder</th>
                      <th className="py-3 px-3">Edge Node</th>
                      <th className="py-3 px-3">Prompt + Completion</th>
                      <th className="py-3 px-3">Jami Token</th>
                      <th className="py-3 px-3">Kechikish</th>
                      <th className="py-3 px-3">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {stats && stats.recentLogs.length > 0 ? (
                      stats.recentLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3 px-3 text-slate-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </td>
                          <td className="py-3 px-3 font-mono font-semibold text-slate-900">
                            {log.model}
                          </td>
                          <td className="py-3 px-3 font-bold text-emerald-700">
                            {log.provider}
                          </td>
                          <td className="py-3 px-3 text-slate-600 text-[11px] truncate max-w-[140px]">
                            {log.node || 'Direct'}
                          </td>
                          <td className="py-3 px-3 font-mono text-slate-500 text-[11px]">
                            {log.promptTokens} in / {log.completionTokens} out
                          </td>
                          <td className="py-3 px-3 font-mono font-bold text-purple-700">
                            {log.totalTokens}
                          </td>
                          <td className="py-3 px-3 font-mono text-cyan-600 font-bold">
                            {log.latencyMs ? `${log.latencyMs} ms` : '—'}
                          </td>
                          <td className="py-3 px-3">
                            {log.status === 'success' ? (
                              <span className="text-emerald-600 font-bold text-[10px] bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                                200 OK
                              </span>
                            ) : (
                              <span className="text-red-500 font-bold text-[10px] bg-red-50 px-2 py-0.5 rounded-full border border-red-200">
                                ERROR
                              </span>
                            )}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          Hozircha so'rovlar logi mavjud emas.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: HEALTH CHECKER & QUOTA ANALYTICS */}
        {activeTab === 'health' && (
          <div className="space-y-6">
            {/* Health Action Card */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <Stethoscope className="w-5 h-5 text-emerald-600" />
                  <span>Jonli Salomatlik Diagnostikasi & Quota Tahlili</span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  AI provayder kalitlarining qolgan kunlik zaxiralari va Edge Nodelarning real-time ulanishi
                </p>
              </div>

              <button
                onClick={handleRunHealthProbe}
                disabled={probing}
                className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-2xl bg-gradient-to-r from-[#00d68f] to-[#059669] hover:from-[#00c483] hover:to-[#04825b] text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer shrink-0"
              >
                <Radio className={`w-4 h-4 ${probing ? 'animate-ping' : ''}`} />
                <span>{probing ? 'Diagnostika qilinmoqda...' : '🩺 Jonli Diagnostika O\'tkazish'}</span>
              </button>
            </div>

            {/* Provider Key Quotas Table */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                    AI Provayder Kalitlari Quota & Tahminiy Qolgan So'rovlar
                  </h3>
                  <p className="text-xs text-slate-500">
                    Har bir kalitning kunlik bepul limiti va bugun qolgan taxminiy quvvati
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                      <th className="py-3 px-3">AI Provayder</th>
                      <th className="py-3 px-3">Kalit</th>
                      <th className="py-3 px-3">Kunlik Limit</th>
                      <th className="py-3 px-3">Ishlatildi</th>
                      <th className="py-3 px-3">Tahminiy Qolgan So'rov</th>
                      <th className="py-3 px-3">Qolgan Zaxira %</th>
                      <th className="py-3 px-3">Yangilanish Vaqti</th>
                      <th className="py-3 px-3">Holat</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {keyQuotas.map((item) => (
                      <tr key={item.keyId} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-3">
                          <div className="font-bold text-slate-900">{item.providerName}</div>
                          <span className="text-[10px] font-mono text-slate-400 uppercase">{item.provider}</span>
                        </td>
                        <td className="py-3.5 px-3 font-mono text-[11px] text-slate-600">
                          {item.maskedKey}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-semibold text-slate-800">
                          {item.dailyRequestsLimit.toLocaleString()} req/kun
                        </td>
                        <td className="py-3.5 px-3 font-mono text-slate-600">
                          {item.usedRequests.toLocaleString()} req
                        </td>
                        <td className="py-3.5 px-3">
                          <div className="font-bold font-mono text-emerald-700 text-sm">
                            ~{item.remainingRequests.toLocaleString()} req
                          </div>
                          <div className="text-[10px] text-slate-400">
                            ~{item.remainingTokens.toLocaleString()} token zaxira
                          </div>
                        </td>
                        <td className="py-3.5 px-3 w-36">
                          <div className="flex items-center justify-between text-[11px] font-bold mb-1">
                            <span className={item.percentRemaining > 20 ? 'text-emerald-700' : 'text-amber-600'}>
                              {item.percentRemaining}%
                            </span>
                          </div>
                          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all ${
                                item.percentRemaining > 20 ? 'bg-[#00d68f]' : 'bg-amber-500'
                              }`}
                              style={{ width: `${item.percentRemaining}%` }}
                            />
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-slate-500 text-[11px]">
                          {item.resetInfo}
                        </td>
                        <td className="py-3.5 px-3">
                          {item.healthStatus === 'healthy' ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              <CheckCircle2 className="w-3 h-3" />
                              FAOL
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle className="w-3 h-3" />
                              {item.healthStatus.toUpperCase()}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Server VDS System Health Specs */}
            {healthSummary?.systemInfo && (
              <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
                <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <HardDrive className="w-4 h-4 text-slate-700" />
                  <span>VDS Server & Tizim Resurslari</span>
                </h3>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Node.js Versiyasi</span>
                    <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {healthSummary.systemInfo.nodeVersion}
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Xotira Sarfi (RAM)</span>
                    <div className="font-mono text-sm font-bold text-emerald-600 mt-0.5">
                      {healthSummary.systemInfo.memoryUsageMb} MB / {healthSummary.systemInfo.totalMemoryMb} MB
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Server Ish Vaqti (Uptime)</span>
                    <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {Math.floor(healthSummary.systemInfo.uptimeSeconds / 3600)}s {Math.floor((healthSummary.systemInfo.uptimeSeconds % 3600) / 60)}d
                    </div>
                  </div>

                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200">
                    <span className="text-[11px] text-slate-400 uppercase font-bold">Operatsion Tizim</span>
                    <div className="font-mono text-sm font-bold text-slate-900 mt-0.5">
                      {healthSummary.systemInfo.platform} ({healthSummary.systemInfo.arch})
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: EDGE HOSTING NODES */}
        {activeTab === 'nodes' && (
          <div className="space-y-6">
            {/* Header / Mode Switcher */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Server className="w-5 h-5 text-[#00d68f]" />
                    <span>Edge Proxy & Worker Hostinglar</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Tashqi bepul va pullik hostinglarda ishlovchi proxy workerlar (Vercel, Cloudflare, Deno Deploy, Netlify, Render, VPS).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setNodeInputMode(nodeInputMode === 'single' ? 'bulk' : 'single')}
                    className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5 text-[#00d68f]" />
                    <span>{nodeInputMode === 'single' ? '⚡️ Ommaviy Yuklash (Bulk)' : 'Yakka Node Qo\'shish'}</span>
                  </button>

                  <button
                    onClick={handlePingAllNodes}
                    disabled={pingingAllNodes || nodes.length === 0}
                    className="px-4 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white text-xs font-bold transition-all shadow-md cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${pingingAllNodes ? 'animate-spin' : ''}`} />
                    <span>{pingingAllNodes ? 'Sinovda...' : '🩺 Barcha Nodelarni Ping Qilish'}</span>
                  </button>
                </div>
              </div>

              {bulkNodeMessage && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
                  {bulkNodeMessage}
                </div>
              )}

              {/* Single Node Form */}
              {nodeInputMode === 'single' && (
                <form onSubmit={handleAddNode} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Hosting Turi</label>
                    <select
                      value={newNodeType}
                      onChange={(e) => setNewNodeType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      <option value="vercel">Vercel Edge</option>
                      <option value="cloudflare">Cloudflare Workers</option>
                      <option value="deno">Deno Deploy</option>
                      <option value="netlify">Netlify Functions</option>
                      <option value="render">Render</option>
                      <option value="koyeb">Koyeb</option>
                      <option value="railway">Railway</option>
                      <option value="custom">Boshqa Custom VPS</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">Node Nomi</label>
                    <input
                      type="text"
                      value={newNodeName}
                      onChange={(e) => setNewNodeName(e.target.value)}
                      placeholder="masalan: Vercel US-East"
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800"
                    />
                  </div>

                  <div className="sm:col-span-2 flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Proxy Endpoint URL</label>
                      <input
                        type="url"
                        required
                        value={newNodeUrl}
                        onChange={(e) => setNewNodeUrl(e.target.value)}
                        placeholder="https://my-proxy.vercel.app/api/proxy"
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                    >
                      Node Qo'shish
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Nodes Form */}
              {nodeInputMode === 'bulk' && (
                <form onSubmit={handleBulkAddNodes} className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <label className="block text-xs font-bold text-slate-800">
                      ⚡️ Bir nechta Proxy Node URL manzillarini tashlang (har bir qatorda bittadan):
                    </label>
                    <p className="text-[11px] text-slate-500">
                      Hosting turi URL manzilidan avtomatik aniqlanadi (Vercel, Cloudflare, Deno, Render, Koyeb, Railway va h.k.).
                    </p>
                    <textarea
                      rows={5}
                      required
                      value={bulkNodesText}
                      onChange={(e) => setBulkNodesText(e.target.value)}
                      placeholder={`https://my-node-1.vercel.app/api/proxy\nhttps://worker-node-2.yoursubdomain.workers.dev\nhttps://my-deno-proxy.deno.dev\nhttps://my-render-node.onrender.com`}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 resize-y"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Barcha Hostinglarni Ulash</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Ready-to-Deploy Code Snippets for Free Hostings */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Code className="w-4 h-4 text-purple-600" />
                    <span>🚀 Bepul Hostinglarga Yuklash Uchun Tayyor Proxy Kodlari</span>
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Ushbu kodlarni Vercel, Cloudflare yoki Deno bepul akkauntlaringizga yuklab, URL manzilini tepada qo'shing.
                  </p>
                </div>
              </div>

              {/* Code Tabs */}
              <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                {[
                  { id: 'vercel', label: '▲ Vercel Edge (api/proxy.js)' },
                  { id: 'cloudflare', label: '☁️ Cloudflare Worker (worker.js)' },
                  { id: 'deno', label: '🦕 Deno Deploy (main.ts)' },
                  { id: 'docker', label: '🐳 Docker / VPS Node.js' },
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setActiveCodeTab(t.id as any)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                      activeCodeTab === t.id
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {t.label}
                  </button>
                ))}
              </div>

              {/* Code Snippet Box */}
              <div className="relative rounded-2xl bg-slate-950 p-4 font-mono text-[11px] text-slate-200 overflow-x-auto">
                <button
                  onClick={() => {
                    const snippets: Record<string, string> = {
                      vercel: `// Vercel Edge Proxy for iportal-ai (api/proxy.js)\nexport const config = { runtime: 'edge' };\n\nexport default async function handler(req) {\n  if (req.method === 'OPTIONS') {\n    return new Response(null, { status: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*' } });\n  }\n  if (req.method === 'GET') {\n    return new Response(JSON.stringify({ status: 'online', node: 'vercel-edge', time: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });\n  }\n  try {\n    const targetUrl = req.headers.get('x-target-url');\n    if (!targetUrl) return new Response('Missing x-target-url header', { status: 400 });\n    const body = await req.arrayBuffer();\n    const forwardHeaders = new Headers();\n    for (const [k, v] of req.headers.entries()) {\n      if (!['host', 'connection', 'content-length', 'x-target-url'].includes(k.toLowerCase())) forwardHeaders.set(k, v);\n    }\n    const res = await fetch(targetUrl, { method: req.method, headers: forwardHeaders, body: body.byteLength > 0 ? body : undefined });\n    const outHeaders = new Headers(res.headers);\n    outHeaders.set('Access-Control-Allow-Origin', '*');\n    return new Response(res.body, { status: res.status, headers: outHeaders });\n  } catch (err) {\n    return new Response(JSON.stringify({ error: err.message }), { status: 500 });\n  }\n}`,
                      cloudflare: `// Cloudflare Worker Proxy for iportal-ai (worker.js)\nexport default {\n  async fetch(request) {\n    if (request.method === 'OPTIONS') {\n      return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Methods': 'GET, POST, OPTIONS', 'Access-Control-Allow-Headers': '*' } });\n    }\n    if (request.method === 'GET') {\n      return new Response(JSON.stringify({ status: 'online', node: 'cloudflare-worker', time: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });\n    }\n    const targetUrl = request.headers.get('x-target-url');\n    if (!targetUrl) return new Response('Missing x-target-url', { status: 400 });\n    const newHeaders = new Headers(request.headers);\n    newHeaders.delete('x-target-url');\n    const res = await fetch(targetUrl, { method: request.method, headers: newHeaders, body: request.body });\n    const outHeaders = new Headers(res.headers);\n    outHeaders.set('Access-Control-Allow-Origin', '*');\n    return new Response(res.body, { status: res.status, headers: outHeaders });\n  }\n};`,
                      deno: `// Deno Deploy Proxy for iportal-ai (main.ts)\nDeno.serve(async (req) => {\n  if (req.method === 'OPTIONS') {\n    return new Response(null, { headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' } });\n  }\n  if (req.method === 'GET') {\n    return new Response(JSON.stringify({ status: 'online', node: 'deno-deploy', time: Date.now() }), { headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' } });\n  }\n  const targetUrl = req.headers.get('x-target-url');\n  if (!targetUrl) return new Response('Missing x-target-url', { status: 400 });\n  const headers = new Headers(req.headers);\n  headers.delete('x-target-url');\n  const res = await fetch(targetUrl, { method: req.method, headers, body: req.body });\n  const outHeaders = new Headers(res.headers);\n  outHeaders.set('Access-Control-Allow-Origin', '*');\n  return new Response(res.body, { status: res.status, headers: outHeaders });\n});`,
                      docker: `// Standalone Node.js Proxy for Docker / VPS (server.js)\nconst http = require('http');\nconst https = require('https');\n\nconst server = http.createServer((req, res) => {\n  res.setHeader('Access-Control-Allow-Origin', '*');\n  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');\n  res.setHeader('Access-Control-Allow-Headers', '*');\n  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }\n  if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 'online' })); }\n  const targetUrl = req.headers['x-target-url'];\n  if (!targetUrl) { res.writeHead(400); return res.end('Missing x-target-url'); }\n  const parsed = new URL(targetUrl);\n  const client = parsed.protocol === 'https:' ? https : http;\n  const opts = { method: req.method, headers: { ...req.headers } };\n  delete opts.headers['host'];\n  delete opts.headers['x-target-url'];\n  const proxyReq = client.request(targetUrl, opts, (proxyRes) => {\n    res.writeHead(proxyRes.statusCode, proxyRes.headers);\n    proxyRes.pipe(res, { end: true });\n  });\n  req.pipe(proxyReq, { end: true });\n});\nserver.listen(process.env.PORT || 8080);`,
                    };
                    handleCopyCodeSnippet(snippets[activeCodeTab], activeCodeTab);
                  }}
                  className="absolute top-3 right-3 px-3 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-xs text-white flex items-center gap-1.5 transition-colors cursor-pointer border border-white/10"
                >
                  {copiedCode === activeCodeTab ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      <span className="text-emerald-400">Nusxalandi!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Kodni Nusxalash</span>
                    </>
                  )}
                </button>

                <pre className="pr-28">
                  {activeCodeTab === 'vercel' && `// Vercel Edge Proxy for iportal-ai (api/proxy.js)
export const config = { runtime: 'edge' };

export default async function handler(req) {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': '*',
      },
    });
  }

  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'online', node: 'vercel-edge', time: Date.now() }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }

  try {
    const targetUrl = req.headers.get('x-target-url');
    if (!targetUrl) return new Response('Missing x-target-url header', { status: 400 });

    const body = await req.arrayBuffer();
    const forwardHeaders = new Headers();
    for (const [k, v] of req.headers.entries()) {
      if (!['host', 'connection', 'content-length', 'x-target-url'].includes(k.toLowerCase())) {
        forwardHeaders.set(k, v);
      }
    }

    const res = await fetch(targetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body: body.byteLength > 0 ? body : undefined,
    });

    const outHeaders = new Headers(res.headers);
    outHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, {
      status: res.status,
      headers: outHeaders,
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}`}

                  {activeCodeTab === 'cloudflare' && `// Cloudflare Worker Proxy for iportal-ai (worker.js)
export default {
  async fetch(request) {
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
          'Access-Control-Allow-Headers': '*',
        },
      });
    }

    if (request.method === 'GET') {
      return new Response(JSON.stringify({ status: 'online', node: 'cloudflare-worker', time: Date.now() }), {
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      });
    }

    const targetUrl = request.headers.get('x-target-url');
    if (!targetUrl) return new Response('Missing x-target-url', { status: 400 });

    const newHeaders = new Headers(request.headers);
    newHeaders.delete('x-target-url');

    const res = await fetch(targetUrl, {
      method: request.method,
      headers: newHeaders,
      body: request.body,
    });

    const outHeaders = new Headers(res.headers);
    outHeaders.set('Access-Control-Allow-Origin', '*');

    return new Response(res.body, {
      status: res.status,
      headers: outHeaders,
    });
  }
};`}

                  {activeCodeTab === 'deno' && `// Deno Deploy Proxy for iportal-ai (main.ts)
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': '*' },
    });
  }
  if (req.method === 'GET') {
    return new Response(JSON.stringify({ status: 'online', node: 'deno-deploy', time: Date.now() }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    });
  }
  const targetUrl = req.headers.get('x-target-url');
  if (!targetUrl) return new Response('Missing x-target-url', { status: 400 });
  const headers = new Headers(req.headers);
  headers.delete('x-target-url');
  const res = await fetch(targetUrl, { method: req.method, headers, body: req.body });
  const outHeaders = new Headers(res.headers);
  outHeaders.set('Access-Control-Allow-Origin', '*');
  return new Response(res.body, { status: res.status, headers: outHeaders });
});`}

                  {activeCodeTab === 'docker' && `// Standalone Node.js Proxy for Docker / VPS (server.js)
const http = require('http');
const https = require('https');

const server = http.createServer((req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', '*');
  if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }
  if (req.method === 'GET') { res.writeHead(200, { 'Content-Type': 'application/json' }); return res.end(JSON.stringify({ status: 'online' })); }
  const targetUrl = req.headers['x-target-url'];
  if (!targetUrl) { res.writeHead(400); return res.end('Missing x-target-url'); }
  const parsed = new URL(targetUrl);
  const client = parsed.protocol === 'https:' ? https : http;
  const opts = { method: req.method, headers: { ...req.headers } };
  delete opts.headers['host'];
  delete opts.headers['x-target-url'];
  const proxyReq = client.request(targetUrl, opts, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });
  req.pipe(proxyReq, { end: true });
});
server.listen(process.env.PORT || 8080);`}
                </pre>
              </div>
            </div>

            {/* Nodes List */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Faol Edge Proxy Nodelar ({nodes.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {nodes.map((node) => (
                  <div
                    key={node.id}
                    className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200 hover:border-emerald-300 transition-all space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-xs uppercase">
                          {node.type.slice(0, 2)}
                        </div>
                        <div>
                          <div className="font-bold text-xs text-slate-900">{node.name}</div>
                          <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                            {node.type}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handlePingNode(node.url)}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-slate-200 text-slate-700 text-[11px] font-bold border border-slate-200 transition-colors"
                        >
                          Ping Test
                        </button>
                        <button
                          onClick={() => handleDeleteNode(node.id)}
                          className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 font-mono text-[11px] text-slate-600 truncate select-all">
                      {node.url}
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                      <span>Holat: <strong className={node.status === 'offline' ? 'text-red-500' : 'text-emerald-600'}>{node.status === 'offline' ? 'Offline' : 'Online (Active)'}</strong></span>
                      <span>Kechikish: <strong className="font-mono text-slate-900">{node.latencyMs ? `${node.latencyMs} ms` : 'Faol'}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 4: PROVIDER KEYS */}
        {activeTab === 'providers' && (
          <div className="space-y-6">
            {/* Add Provider Key Form */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
                    <Key className="w-5 h-5 text-amber-500" />
                    <span>AI Provayder Kalitlari Boshqaruvi</span>
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Groq, Gemini, SambaNova, Cerebras, OpenRouter, Mistral, Cloudflare, HuggingFace bepul kalitlarini qo'shing.
                  </p>
                </div>

                <button
                  onClick={() => setProviderInputMode(providerInputMode === 'single' ? 'bulk' : 'single')}
                  className="px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors cursor-pointer flex items-center gap-1.5 shrink-0"
                >
                  <Upload className="w-3.5 h-3.5 text-amber-500" />
                  <span>{providerInputMode === 'single' ? '⚡️ Ommaviy Kalitlarni Yuklash (Bulk)' : 'Yakka Kalit Qo\'shish'}</span>
                </button>
              </div>

              {bulkProviderMessage && (
                <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs font-semibold animate-in fade-in">
                  {bulkProviderMessage}
                </div>
              )}

              {/* Single Key Form */}
              {providerInputMode === 'single' && (
                <form onSubmit={handleAddProviderKey} className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-600 mb-1">AI Provayder</label>
                    <select
                      value={newProvider}
                      onChange={(e) => setNewProvider(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800"
                    >
                      <option value="groq">Groq Cloud (LPU 120B)</option>
                      <option value="gemini">Google Gemini 2.0</option>
                      <option value="sambanova">SambaNova (DeepSeek R1)</option>
                      <option value="cerebras">Cerebras (CS-3 1000 tok/s)</option>
                      <option value="openrouter">OpenRouter Mesh</option>
                      <option value="mistral">Mistral AI</option>
                      <option value="cloudflare">Cloudflare Workers AI</option>
                      <option value="huggingface">HuggingFace Hub</option>
                    </select>
                  </div>

                  <div className="sm:col-span-3 flex gap-2 items-end">
                    <div className="flex-1">
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">API Key</label>
                      <input
                        type="password"
                        required
                        value={newProviderKey}
                        onChange={(e) => setNewProviderKey(e.target.value)}
                        placeholder="gsk_... yoki AIzaSy... yoki sn_..."
                        className="w-full px-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-800 font-mono"
                      />
                    </div>
                    <button
                      type="submit"
                      className="px-5 py-2.5 rounded-xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md transition-all cursor-pointer shrink-0"
                    >
                      Kalit Qo'shish
                    </button>
                  </div>
                </form>
              )}

              {/* Bulk Keys Form */}
              {providerInputMode === 'bulk' && (
                <form onSubmit={handleBulkAddProviderKeys} className="space-y-3 pt-2">
                  <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <label className="block text-xs font-bold text-slate-800">
                        ⚡️ Bir nechta API Kalitlarni tashlang (har bir qatorda bittadan yoki vergul bilan):
                      </label>
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-bold text-slate-500">Asosiy provayder:</span>
                        <select
                          value={newProvider}
                          onChange={(e) => setNewProvider(e.target.value)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-[11px] font-bold text-slate-800"
                        >
                          <option value="groq">Groq (gsk_)</option>
                          <option value="gemini">Gemini (AIzaSy)</option>
                          <option value="sambanova">SambaNova</option>
                          <option value="cerebras">Cerebras (csk-)</option>
                          <option value="openrouter">OpenRouter (sk-or-)</option>
                          <option value="mistral">Mistral</option>
                          <option value="cloudflare">Cloudflare AI</option>
                          <option value="huggingface">HuggingFace (hf_)</option>
                        </select>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-500">
                      Kalit prefikslari (gsk_, AIzaSy, csk-, sk-or-, hf_) orqali provayder avtomatik aniqlanadi. Dublikatlar avtomatik o'tkazib yuboriladi.
                    </p>
                    <textarea
                      rows={5}
                      required
                      value={bulkProviderKeysText}
                      onChange={(e) => setBulkProviderKeysText(e.target.value)}
                      placeholder={`gsk_xxxxxxx1\ngsk_xxxxxxx2\nAIzaSyxxxxxxx3\ncsk-xxxxxxx4\nsk-or-v1-xxxxxxx5`}
                      className="w-full p-3 rounded-xl bg-white border border-slate-200 text-xs font-mono text-slate-900 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-y"
                    />
                  </div>

                  <div className="flex justify-end">
                    <button
                      type="submit"
                      className="px-6 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md transition-all cursor-pointer flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Barcha Kalitlarni Qo'shish & Saqlash</span>
                    </button>
                  </div>
                </form>
              )}
            </div>

            {/* Provider Keys List */}
            <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                Faol AI Provayder Kalitlari ({providers.length})
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {providers.map((k) => (
                  <div
                    key={k.id}
                    className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <span className="font-bold text-xs text-slate-900 uppercase">{k.provider}</span>
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 font-semibold font-mono">
                          {k.status}
                        </span>
                      </div>
                      <div className="font-mono text-xs text-slate-500 mt-1 truncate">
                        {k.maskedKey}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-1">
                        So'rovlar: <strong className="text-slate-700">{k.successCount || 0}</strong> muvaffaqiyatli
                      </div>
                    </div>

                    <button
                      onClick={() => handleDeleteProviderKey(k.id)}
                      className="p-1.5 rounded-lg bg-white hover:bg-red-50 text-slate-400 hover:text-red-500 border border-slate-200 transition-colors"
                      title="O'chirish"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 5: USERS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="bg-white rounded-3xl border border-[#dce8e2] p-5 sm:p-6 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Ro'yxatdan O'tgan Foydalanuvchilar ({users.length})
            </h2>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-100 text-slate-400 uppercase tracking-wider font-semibold text-[11px]">
                    <th className="py-3 px-3">Foydalanuvchi</th>
                    <th className="py-3 px-3">Email</th>
                    <th className="py-3 px-3">Rol</th>
                    <th className="py-3 px-3">Balans</th>
                    <th className="py-3 px-3">So'rovlar</th>
                    <th className="py-3 px-3">Holat</th>
                    <th className="py-3 px-3">Amallar</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {users.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3.5 px-3 font-bold text-slate-900">
                        {u.name}
                      </td>
                      <td className="py-3.5 px-3 text-slate-600 font-mono text-[11px]">
                        {u.email}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-800' : 'bg-slate-100 text-slate-700'
                        }`}>
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-mono font-bold text-emerald-600">
                        ${u.balance.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-3 font-mono text-slate-700">
                        {u.totalRequests} req
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          u.status === 'active' ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'
                        }`}>
                          {u.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => setEditingUserId(editingUserId === u.id ? null : u.id)}
                            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-bold transition-colors"
                          >
                            + Balans
                          </button>
                          {u.role !== 'admin' && (
                            <button
                              onClick={() => handleToggleUserStatus(u)}
                              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-red-100 text-slate-600 hover:text-red-700 text-[11px] font-bold transition-colors"
                            >
                              {u.status === 'active' ? 'Bloklash' : 'Faollashtirish'}
                            </button>
                          )}
                        </div>

                        {/* Balance Edit Popover */}
                        {editingUserId === u.id && (
                          <div className="mt-2 p-2.5 bg-white border border-slate-200 rounded-xl shadow-lg flex items-center gap-2">
                            <input
                              type="number"
                              step="1"
                              value={addAmount}
                              onChange={(e) => setAddAmount(e.target.value)}
                              className="w-20 px-2 py-1 bg-slate-50 border border-slate-200 rounded text-xs font-mono"
                            />
                            <button
                              onClick={() => handleAddBalance(u.id)}
                              className="px-3 py-1 bg-[#00d68f] text-slate-950 rounded text-xs font-bold"
                            >
                              Qo'shish
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
