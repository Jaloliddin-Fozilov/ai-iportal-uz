'use client';

import React, { useState, useEffect } from 'react';
import { 
  Mail, 
  Inbox, 
  RefreshCw, 
  Trash2, 
  ArrowLeft, 
  Copy, 
  Check, 
  Lock, 
  Key,
  LogOut
} from 'lucide-react';
import Link from 'next/link';

interface EmailItem {
  id: string;
  account: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  timestamp: number;
  body: string;
  preview: string;
  isHtml: boolean;
}

export default function WebmailPage() {
  const [selectedAccount, setSelectedAccount] = useState<string>('all');
  const [emails, setEmails] = useState<EmailItem[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<EmailItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [copiedText, setCopiedText] = useState<string | null>(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Authentication State
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [mailPassword, setMailPassword] = useState<string>('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [authToken, setAuthToken] = useState<string>('');

  const accounts = [
    { name: 'Barcha Xabarlar (All)', email: '', id: 'all' },
    { name: 'ai1@iportal.uz', email: 'ai1@iportal.uz', id: 'ai1' },
    { name: 'ai2@iportal.uz', email: 'ai2@iportal.uz', id: 'ai2' },
    { name: 'ai3@iportal.uz', email: 'ai3@iportal.uz', id: 'ai3' },
    { name: 'ai4@iportal.uz', email: 'ai4@iportal.uz', id: 'ai4' },
    { name: 'ai5@iportal.uz', email: 'ai5@iportal.uz', id: 'ai5' },
  ];

  useEffect(() => {
    const savedToken = localStorage.getItem('iportal_mail_token') || localStorage.getItem('iportal_auth_token') || '';
    if (savedToken) {
      setAuthToken(savedToken);
      fetchEmailsWithToken(savedToken, selectedAccount);
    }
  }, []);

  const fetchEmailsWithToken = async (token: string, account = selectedAccount) => {
    if (!token) {
      setIsAuthenticated(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/mail?account=${account}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) {
        setIsAuthenticated(true);
        setEmails(data.emails || []);
        if (selectedEmail) {
          const updated = data.emails?.find((e: EmailItem) => e.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        } else if (data.emails?.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      } else {
        setIsAuthenticated(false);
      }
    } catch (e) {
      setIsAuthenticated(false);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);

    const tokenToTry = mailPassword.trim();

    try {
      const res = await fetch(`/api/mail?account=all`, {
        headers: { Authorization: `Bearer ${tokenToTry}` },
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('iportal_mail_token', tokenToTry);
        setAuthToken(tokenToTry);
        setIsAuthenticated(true);
        setEmails(data.emails || []);
        if (data.emails?.length > 0) setSelectedEmail(data.emails[0]);
      } else {
        setLoginError('Parol noto\'g\'ri! Iltimos, to\'g\'ri parolni kiriting.');
      }
    } catch (err: any) {
      setLoginError(err.message || 'Xatolik yuz berdi');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('iportal_mail_token');
    setAuthToken('');
    setIsAuthenticated(false);
    setEmails([]);
    setSelectedEmail(null);
  };

  const handleAccountChange = (accId: string) => {
    setSelectedAccount(accId);
    if (authToken) {
      fetchEmailsWithToken(authToken, accId);
    }
  };

  // Auto refresh every 6 seconds if authenticated
  useEffect(() => {
    if (!autoRefresh || !isAuthenticated || !authToken) return;
    const timer = setInterval(() => {
      fetch(`/api/mail?account=${selectedAccount}`, {
        headers: { Authorization: `Bearer ${authToken}` },
      })
        .then(r => r.json())
        .then(data => {
          if (data.success && data.emails) {
            setEmails(data.emails);
          }
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(timer);
  }, [autoRefresh, isAuthenticated, authToken, selectedAccount]);

  const copyToClipboard = async (text: string, id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(id);
      setTimeout(() => setCopiedText(null), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteEmail = async (email: EmailItem, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/api/mail?account=${email.account}&id=${email.id}`, { 
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data.success) {
        setEmails(emails.filter(m => m.id !== email.id));
        if (selectedEmail?.id === email.id) {
          setSelectedEmail(null);
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Extract OTP/digits if present in text
  const otpMatch = selectedEmail?.body.match(/\b\d{4,8}\b/);

  // 1. Render Login Screen if NOT authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen w-screen bg-[#080b12] text-gray-100 flex items-center justify-center p-4 font-sans">
        <div className="w-full max-w-sm p-6 rounded-2xl bg-[#0f1422] border border-[#1e293f] shadow-2xl space-y-4">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg">
              <Lock className="w-6 h-6" />
            </div>
            <h1 className="text-base font-bold text-white">iportal.uz Webmail Markazi</h1>
            <p className="text-xs text-gray-400">Pochtalarni va kelgan xatlarni ko'rish uchun parolni kiriting</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-3 pt-2">
            {loginError && (
              <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/40 text-xs text-red-300">
                {loginError}
              </div>
            )}
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">Webmail Paroli</label>
              <div className="relative">
                <Key className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="password"
                  required
                  value={mailPassword}
                  onChange={(e) => setMailPassword(e.target.value)}
                  placeholder="Pochta yoki Admin paroli"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs transition-all shadow-md cursor-pointer"
            >
              Webmailga Kirish
            </button>
          </form>

          <div className="text-center pt-2">
            <Link href="/" className="text-xs text-gray-400 hover:text-cyan-400 flex items-center justify-center gap-1">
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Bosh sahifaga qaytish</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // 2. Render Authenticated Webmail Screen
  return (
    <div className="h-screen w-screen bg-[#080b12] text-gray-100 font-sans flex flex-col overflow-hidden">
      {/* Top Navbar */}
      <header className="h-16 border-b border-[#1a2336] bg-[#0c101c] px-4 md:px-6 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Link href="/" className="p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#182136]">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-md">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-sm text-white">iportal.uz Webmail Markazi</h1>
                <span className="text-[10px] px-2 py-0.2 rounded bg-green-500/10 text-green-400 border border-green-500/20 font-mono">
                  Himoyalangan
                </span>
              </div>
              <p className="text-[11px] text-gray-400">Tasdiqlash kodlari va xatlarni real vaqtda ko'rish</p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Auto refresh toggle */}
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
              autoRefresh 
                ? 'bg-blue-600/20 border-blue-500/40 text-blue-300' 
                : 'bg-[#141a29] border-[#232f48] text-gray-400'
            }`}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${autoRefresh ? 'animate-spin-slow' : ''}`} />
            <span>{autoRefresh ? 'Avto-yangilanish: Yoqilgan' : 'Avto-yangilanish: O\'chiq'}</span>
          </button>

          <button
            onClick={() => fetchEmailsWithToken(authToken)}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1f283d] border border-[#232f48] text-xs text-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>

          {/* Logout button */}
          <button
            onClick={handleLogout}
            className="p-1.5 rounded-lg bg-[#182136] hover:bg-red-950 text-gray-400 hover:text-red-400 transition-colors"
            title="Webmaildan chiqish"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Mail Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Accounts Sidebar */}
        <div className="w-72 border-r border-[#1a2336] bg-[#0c101c] flex flex-col p-3 space-y-3 shrink-0 hidden md:flex">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2 flex items-center justify-between">
            <span>Mavjud 5 ta Pochta</span>
            <span className="text-[10px] text-gray-500 font-normal">Nusxalash</span>
          </div>

          <div className="space-y-1.5">
            {accounts.map((acc) => {
              const isSelected = selectedAccount === acc.id;
              const count = acc.id === 'all' 
                ? emails.length 
                : emails.filter(e => e.account === acc.id).length;

              return (
                <div
                  key={acc.id}
                  onClick={() => handleAccountChange(acc.id)}
                  className={`group w-full flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-gray-300 bg-[#101524] hover:bg-[#151c2c] hover:text-white border border-[#1c2438]'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate min-w-0">
                    <Inbox className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate font-mono">{acc.name}</span>
                  </div>

                  <div className="flex items-center gap-1 shrink-0 ml-1">
                    {count > 0 && (
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                        isSelected ? 'bg-white text-blue-700' : 'bg-[#1e293f] text-cyan-400'
                      }`}>
                        {count}
                      </span>
                    )}

                    {/* Copy email button */}
                    {acc.email && (
                      <button
                        onClick={(e) => copyToClipboard(acc.email, `acc-${acc.id}`, e)}
                        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
                          isSelected 
                            ? 'bg-blue-700/80 hover:bg-blue-800 text-white' 
                            : 'bg-[#161f33] hover:bg-blue-600 text-gray-300 hover:text-white'
                        }`}
                        title="Pochta manzilidan nusxa olish"
                      >
                        {copiedText === `acc-${acc.id}` ? (
                          <Check className="w-3.5 h-3.5 text-emerald-300" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Credentials box */}
          <div className="mt-auto p-3 rounded-xl bg-[#121726] border border-[#1e293f] space-y-2 text-xs">
            <div className="flex items-center gap-1.5 text-amber-400 font-bold text-[11px]">
              <Key className="w-3.5 h-3.5" />
              <span>Barcha Pochtalarning Paroli:</span>
            </div>
            <div className="flex items-center justify-between p-1.5 rounded-lg bg-[#090d16] font-mono text-gray-200 border border-[#232f48]">
              <span>20020210FjX!</span>
              <button
                onClick={() => copyToClipboard('20020210FjX!', 'pwd')}
                className="p-1 rounded text-gray-400 hover:text-white hover:bg-[#1a2336]"
                title="Paroldan nusxa olish"
              >
                {copiedText === 'pwd' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Email List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#1a2336] bg-[#090d17] flex flex-col shrink-0 overflow-y-auto">
          {/* Mobile Accounts Selector */}
          <div className="p-3 border-b border-[#1a2336] md:hidden flex gap-2">
            <select
              value={selectedAccount}
              onChange={(e) => handleAccountChange(e.target.value)}
              className="flex-1 px-3 py-2 rounded-xl bg-[#121726] border border-[#1e293f] text-xs text-white"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
            {selectedAccount !== 'all' && (
              <button
                onClick={() => copyToClipboard(`${selectedAccount}@iportal.uz`, 'mob-copy')}
                className="px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1"
                title="Tanlangan pochtani nusxalash"
              >
                {copiedText === 'mob-copy' ? <Check className="w-3.5 h-3.5 text-green-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>Nusxa</span>
              </button>
            )}
          </div>

          {emails.length === 0 ? (
            <div className="p-8 text-center text-xs text-gray-500 space-y-2 my-auto">
              <Inbox className="w-10 h-10 mx-auto text-gray-600" />
              <p className="font-semibold text-gray-400">Hozircha xatlar yo'q</p>
              <p className="text-[11px]">Tashqi xizmatlardan ro'yxatdan o'tganingizda, tasdiqlash xatlari shu yerda bir zumda paydo bo'ladi.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#161e30]">
              {emails.map((item) => {
                const isSelected = selectedEmail?.id === item.id;
                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedEmail(item)}
                    className={`p-3.5 cursor-pointer transition-all ${
                      isSelected ? 'bg-[#162033] border-l-4 border-blue-500' : 'hover:bg-[#101624]'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-xs text-white truncate max-w-[160px]">
                        {item.from}
                      </span>
                      <span className="text-[10px] text-gray-400 font-mono">
                        {item.account}@iportal.uz
                      </span>
                    </div>
                    <div className="text-xs font-semibold text-gray-200 truncate mb-1">
                      {item.subject}
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
                      {item.preview}
                    </p>
                    <div className="flex items-center justify-between mt-2 pt-1 border-t border-[#1e293f]/50">
                      <span className="text-[10px] text-gray-500">{item.date}</span>
                      <button
                        onClick={(e) => handleDeleteEmail(item, e)}
                        className="p-1 text-gray-500 hover:text-red-400 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right: Email Content Viewer */}
        <div className="flex-1 bg-[#0c101c] flex flex-col overflow-y-auto p-4 md:p-6">
          {selectedEmail ? (
            <div className="max-w-3xl w-full mx-auto space-y-4">
              {/* Header Box */}
              <div className="p-4 rounded-2xl bg-[#121726] border border-[#1e293f] space-y-3">
                <div className="flex items-start justify-between">
                  <h2 className="text-base font-bold text-white leading-snug">
                    {selectedEmail.subject}
                  </h2>
                  <span className="text-xs text-gray-400 shrink-0 font-mono">
                    {selectedEmail.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs pt-1 border-t border-[#1e293f]/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-gray-400 shrink-0">Yuboruvchi:</span>
                    <span className="font-semibold text-white font-mono truncate">{selectedEmail.from}</span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1 truncate">
                      <span className="text-gray-400 shrink-0">Qabul qiluvchi:</span>
                      <span className="font-semibold text-cyan-400 font-mono truncate">{selectedEmail.to}</span>
                    </div>
                    <button
                      onClick={() => copyToClipboard(selectedEmail.to, 'copy-to')}
                      className="p-1 rounded bg-[#161f33] hover:bg-blue-600 text-gray-300 hover:text-white transition-colors"
                      title="Qabul qiluvchi pochtadan nusxa olish"
                    >
                      {copiedText === 'copy-to' ? <Check className="w-3 h-3 text-green-300" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>

                {/* OTP Quick Copy helper */}
                {otpMatch && (
                  <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/40 flex items-center justify-between">
                    <div>
                      <span className="text-[11px] text-emerald-300 font-semibold">Topilgan Tasdiqlash Kodi (OTP):</span>
                      <div className="text-xl font-bold font-mono text-white tracking-widest">
                        {otpMatch[0]}
                      </div>
                    </div>
                    <button
                      onClick={() => copyToClipboard(otpMatch[0], 'otp')}
                      className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-md cursor-pointer"
                    >
                      {copiedText === 'otp' ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedText === 'otp' ? 'Nusxalandi' : 'Kodni Nusxalash'}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Message Body */}
              <div className="p-5 rounded-2xl bg-[#121726] border border-[#1e293f] text-xs md:text-sm text-gray-200 leading-relaxed overflow-x-auto">
                {selectedEmail.isHtml ? (
                  <div
                    dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                    className="prose prose-invert max-w-none"
                  />
                ) : (
                  <pre className="whitespace-pre-wrap font-sans text-xs md:text-sm">
                    {selectedEmail.body}
                  </pre>
                )}
              </div>
            </div>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center text-gray-500 space-y-3">
              <Mail className="w-12 h-12 text-gray-600" />
              <p className="text-sm font-semibold text-gray-400">Xatni tanlang</p>
              <p className="text-xs text-gray-500">Chap tomondagi ro'yxatdan o'qimoqchi bo'lgan xatingizni bosing.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
