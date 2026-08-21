'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sliders, Sparkles } from 'lucide-react';

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
        <div className="mb-3 p-3 rounded-xl bg-[#111624] border border-[#232f48] shadow-lg animate-in fade-in">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-blue-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              Tizim Ko\'rsatmasi (System Persona Prompt)
            </span>
            <button
              onClick={() => setShowSystemSettings(false)}
              className="text-xs text-gray-400 hover:text-white"
            >
              Yopish
            </button>
          </div>
          <textarea
            value={systemPrompt}
            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
            rows={2}
            className="w-full bg-[#0a0d16] border border-[#1e283d] rounded-lg p-2 text-xs text-gray-200 focus:outline-none focus:border-blue-500 font-sans"
            placeholder="AI modeliga rol yoki maxsus ko'rsatma bering..."
          />
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative rounded-2xl bg-[#121624] border border-[#20293d] shadow-2xl focus-within:border-blue-500/60 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
          placeholder="iportal-ai ga xabar yozing... (Enter — yuborish, Shift+Enter — yangi qator)"
          className="w-full bg-transparent text-gray-100 placeholder-gray-500 px-4 pt-3.5 pb-12 focus:outline-none resize-none text-sm leading-relaxed max-h-48 overflow-y-auto"
        />

        {/* Bottom Actions Bar */}
        <div className="absolute bottom-2.5 left-3 right-3 flex items-center justify-between pointer-events-none">
          {/* Left tools */}
          <div className="flex items-center gap-1 pointer-events-auto">
            <button
              type="button"
              onClick={() => setShowSystemSettings(!showSystemSettings)}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors cursor-pointer ${
                showSystemSettings
                  ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-[#1c2338]'
              }`}
              title="System prompt sozlash"
            >
              <Sliders className="w-3.5 h-3.5" />
              <span className="text-[11px] hidden sm:inline">Ko'rsatma</span>
            </button>
          </div>

          {/* Right Action: Send or Stop */}
          <div className="pointer-events-auto">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-600/80 hover:bg-red-600 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>To\'xtatish</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className={`p-2 rounded-xl text-white transition-all shadow-md cursor-pointer ${
                  input.trim()
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-blue-500/25'
                    : 'bg-gray-800 text-gray-500 cursor-not-allowed opacity-50'
                }`}
                title="Xabar yuborish"
              >
                <Send className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="mt-2 text-center text-[11px] text-gray-500">
        ai.iportal.uz — Ko'p provayderli taqsimlangan bepul AI platformasi
      </div>
    </div>
  );
};
