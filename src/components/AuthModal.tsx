'use client';

import React, { useState } from 'react';
import { X, Lock, Mail, User, Gift, LogIn, UserPlus, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-md bg-[#0d121f] border border-[#232f48] rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Top Header */}
        <div className="p-5 border-b border-[#1e293f] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                {mode === 'register' ? 'Hisob Ochish' : 'Tizimga Kirish'}
              </h2>
              <p className="text-[11px] text-gray-400">ai.iportal.uz — AI Platformasi</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-gray-400 hover:text-white hover:bg-[#1a2336] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free $5 Bonus Banner */}
        {mode === 'register' && (
          <div className="px-5 pt-4">
            <div className="p-3 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/30 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20 text-emerald-400">
                <Gift className="w-5 h-5 animate-bounce" />
              </div>
              <div className="text-xs">
                <span className="font-bold text-emerald-300">Maxsus Sovg'a: $5.00 Bepul Balans!</span>
                <p className="text-[11px] text-gray-300">Ro'yxatdan o'ting va darhol $5 balans hamda shaxsiy API kalit oling.</p>
              </div>
            </div>
          </div>
        )}

        {/* Tab switcher */}
        <div className="flex border-b border-[#1e293f] bg-[#0a0e1a] px-5 mt-3">
          <button
            onClick={() => { setMode('register'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              mode === 'register'
                ? 'border-blue-500 text-blue-400 bg-[#121828]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Ro'yxatdan o'tish</span>
          </button>
          <button
            onClick={() => { setMode('login'); setError(null); }}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold border-b-2 transition-all cursor-pointer ${
              mode === 'login'
                ? 'border-blue-500 text-blue-400 bg-[#121828]'
                : 'border-transparent text-gray-400 hover:text-gray-200'
            }`}
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Kirish</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {error && (
            <div className="p-2.5 rounded-lg bg-red-950/50 border border-red-800/40 text-xs text-red-300">
              {error}
            </div>
          )}

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-medium text-gray-300 mb-1">Ismingiz</label>
              <div className="relative">
                <User className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ismingiz yoki Taxallus"
                  className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">Email Manzil</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="misol@gmail.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-medium text-gray-300 mb-1">Parol</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-gray-500 absolute left-3 top-3" />
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Kamida 6 belgi"
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#141a29] border border-[#232f48] text-xs text-gray-100 placeholder-gray-500 focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs shadow-lg shadow-blue-500/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {loading ? 'Bajarilmoqda...' : mode === 'register' ? 'Ro\'yxatdan o\'tish ($5 Balans Olish)' : 'Tizimga Kirish'}
          </button>
        </form>
      </div>
    </div>
  );
};
