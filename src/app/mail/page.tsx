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
  ExternalLink, 
  ShieldCheck, 
  Lock, 
  Sparkles,
  Key
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

  const accounts = [
    { name: 'Barcha Pochtalarga Kelganlar', id: 'all' },
    { name: 'ai1@iportal.uz', id: 'ai1' },
    { name: 'ai2@iportal.uz', id: 'ai2' },
    { name: 'ai3@iportal.uz', id: 'ai3' },
    { name: 'ai4@iportal.uz', id: 'ai4' },
    { name: 'ai5@iportal.uz', id: 'ai5' },
  ];

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/mail?account=${selectedAccount}`);
      const data = await res.json();
      if (data.success) {
        setEmails(data.emails || []);
        if (selectedEmail) {
          const updated = data.emails?.find((e: EmailItem) => e.id === selectedEmail.id);
          if (updated) setSelectedEmail(updated);
        } else if (data.emails?.length > 0 && !selectedEmail) {
          setSelectedEmail(data.emails[0]);
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
  }, [selectedAccount]);

  // Auto refresh every 6 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const timer = setInterval(() => {
      fetch(`/api/mail?account=${selectedAccount}`)
        .then(r => r.json())
        .then(data => {
          if (data.success && data.emails) {
            setEmails(data.emails);
          }
        })
        .catch(() => {});
    }, 6000);
    return () => clearInterval(timer);
  }, [autoRefresh, selectedAccount]);

  const copyToClipboard = async (text: string, id: string) => {
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
      const res = await fetch(`/api/mail?account=${email.account}&id=${email.id}`, { method: 'DELETE' });
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
                  Jonli Qabul Qiluvchi
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
            onClick={fetchEmails}
            disabled={loading}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#141a29] hover:bg-[#1f283d] border border-[#232f48] text-xs text-gray-200 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Yangilash</span>
          </button>
        </div>
      </header>

      {/* Main Mail Grid */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Accounts Sidebar */}
        <div className="w-64 border-r border-[#1a2336] bg-[#0c101c] flex flex-col p-3 space-y-3 shrink-0 hidden md:flex">
          <div className="text-[11px] font-bold text-gray-400 uppercase tracking-wider px-2">
            Mavjud 5 ta Pochta
          </div>

          <div className="space-y-1">
            {accounts.map((acc) => {
              const isSelected = selectedAccount === acc.id;
              const count = acc.id === 'all' 
                ? emails.length 
                : emails.filter(e => e.account === acc.id).length;

              return (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc.id)}
                  className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600 text-white font-semibold shadow-md'
                      : 'text-gray-300 hover:bg-[#151c2c] hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <Inbox className={`w-4 h-4 shrink-0 ${isSelected ? 'text-white' : 'text-gray-400'}`} />
                    <span className="truncate">{acc.name}</span>
                  </div>
                  {count > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                      isSelected ? 'bg-white text-blue-700' : 'bg-[#1e293f] text-cyan-400'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
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
                className="text-gray-400 hover:text-white"
              >
                {copiedText === 'pwd' ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Middle: Email List */}
        <div className="w-full md:w-80 lg:w-96 border-r border-[#1a2336] bg-[#090d17] flex flex-col shrink-0 overflow-y-auto">
          {/* Mobile Accounts Selector */}
          <div className="p-3 border-b border-[#1a2336] md:hidden">
            <select
              value={selectedAccount}
              onChange={(e) => setSelectedAccount(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#121726] border border-[#1e293f] text-xs text-white"
            >
              {accounts.map(a => (
                <option key={a.id} value={a.id}>{a.name}</option>
              ))}
            </select>
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
                  <div>
                    <span className="text-gray-400">Yuboruvchi:</span>{' '}
                    <span className="font-semibold text-white font-mono">{selectedEmail.from}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Qabul qiluvchi:</span>{' '}
                    <span className="font-semibold text-cyan-400 font-mono">{selectedEmail.to}</span>
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
