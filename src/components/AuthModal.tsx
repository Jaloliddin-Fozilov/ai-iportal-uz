'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Gift, LogIn, UserPlus, ShieldCheck, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (userData: any, token: string) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [mode, setMode] = useState<'login' | 'register'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const endpoint = mode === 'register' ? '/api/auth/register' : '/api/auth/login';
    const payload = mode === 'register' ? { name, email, password } : { email, password };

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Xatolik yuz berdi');
      }

      if (mode === 'register') {
        confetti({
          particleCount: 70,
          spread: 70,
          origin: { y: 0.6 },
        });
      }

      onSuccess(data.user, data.token);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0c101c] border border-[#1b253b] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#162035] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-blue-400/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">
                {mode === 'register' ? 'Hisob Ochish' : 'Tizimga Kirish'}
              </h2>
              <p className="text-[11px] text-slate-400">ai.iportal.uz — Milliy AI Platformasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#141b2b] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free $5 Bonus Banner */}
        {mode === 'register' && (
          <div className="px-4 sm:px-5 pt-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/40 to-blue-950/40 border border-emerald-500/25 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/15 text-emerald-400 shrink-0">
                <Gift className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-xs min-w-0">
                <span className="font-bold text-emerald-300">$5.00 Bepul Start Balansi!</span>
                <p className="text-[11px] text-slate-300 mt-0.5 leading-snug">Ro'yxatdan o'ting va darhol shaxsiy API kalitga ega bo'ling.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-[#162035] bg-[#080b13] px-4 sm:px-5 mt-3">
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-blue-500 text-blue-400 bg-[#0e1424]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ro'yxatdan o'tish</span>
          </button>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-blue-500 text-blue-400 bg-[#0e1424]'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-xl bg-red-950/40 border border-red-800/40 text-xs text-red-300">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-slate-300 mb-1">Ismingiz</label>
              <div className="relative">
                <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingiz yoki Taxallus"
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080b13] border border-[#192338] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Email Manzil</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misol@gmail.com"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080b13] border border-[#192338] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-slate-300 mb-1">Parol</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
                className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-[#080b13] border border-[#192338] text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Bajarilmoqda...' : mode === 'register' ? 'Ro\'yxatdan o\'tish ($5.00 Balans Olish)' : 'Tizimga Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
};
