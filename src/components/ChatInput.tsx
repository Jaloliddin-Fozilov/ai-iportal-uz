'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sliders, Sparkles, ShieldCheck } from 'lucide-react';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  systemPrompt: string;
  onUpdateSystemPrompt: (prompt: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStop,
  isStreaming,
  systemPrompt,
  onUpdateSystemPrompt,
}) => {
  const [input, setInput] = useState('');
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [input]);

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isStreaming) return;
    onSendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 md:px-6 pb-4">
      {/* System prompt toggle modal / drawer */}
      {showSystemSettings && (
        <div className="mb-3 p-3.5 rounded-2xl bg-[#0e1422] border border-[#1e293f] shadow-2xl animate-in fade-in space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>Shaxsiy Ko'rsatma (Ixtiyoriy)</span>
            </div>
            <button
              onClick={() => setShowSystemSettings(false)}
              className="text-xs text-slate-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            AI ga o'zingiz xohlagan qo'shimcha uslub yoki rolni belgilang (masalan: <em>"Python bo'yicha mutaxassis sifatida gapir"</em> yoki <em>"Javoblarni faqat punktlarda ber"</em>).
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
            rows={2}
            className="w-full bg-[#070a12] border border-[#1a2337] rounded-xl p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans resize-none"
            placeholder="AI modeliga shaxsiy ko'rsatmalaringizni yozing..."
          />
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-[#0d121f] border border-[#1a243a] shadow-2xl shadow-black/40 focus-within:border-cyan-500/50 focus-within:ring-1 focus-within:ring-cyan-500/20 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="iportal-ai ga xabar yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
          className="w-full bg-transparent text-slate-100 placeholder-slate-500 px-4 pt-3.5 pb-12 focus:outline-none resize-none text-sm leading-relaxed max-h-48 overflow-y-auto"
        />

        {/* Bottom Actions Bar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Left tools */}
          <div className="flex items-center gap-1.5 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowSystemSettings(!showSystemSettings)}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-xl text-xs transition-all cursor-pointer ${
                showSystemSettings || systemPrompt.trim()
                  ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#151c2d]'
              }`}
              title="Shaxsiy ko'rsatma sozlash"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">
                {systemPrompt.trim() ? "Ko'rsatma faol" : "Ko'rsatma"}
              </span>
            </button>
          </div>

          {/* Right Action: Send or Stop */}
          <div className="pointer-events-auto">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/90 hover:bg-red-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>To'xtatish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className={`p-2 rounded-xl text-white transition-all shadow-md cursor-pointer ${
                  input.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 shadow-blue-500/25'
                    : 'bg-[#151c2d] text-slate-600 cursor-not-allowed'
                }`}
                title="Xabar yuborish"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-slate-500">
        iportal-ai xatoliklarga yo'l qo'yishi mumkin. Muhim ma'lumotlarni tekshiring.
      </div>
    </div>
  );
};
