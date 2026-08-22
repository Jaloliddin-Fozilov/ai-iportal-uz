'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Square, Sparkles, Plus, ArrowUp, Wand2, Image as ImageIcon } from 'lucide-react';
import { ModelSelector } from './ModelSelector';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onStop: () => void;
  isStreaming: boolean;
  systemPrompt: string;
  onUpdateSystemPrompt: (prompt: string) => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStop,
  isStreaming,
  systemPrompt,
  onUpdateSystemPrompt,
  selectedModel,
  onSelectModel,
}) => {
  const [input, setInput] = useState('');
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isImageMode = selectedModel === 'iportal-image' || selectedModel === 'image-flux';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
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
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4">
      {/* System prompt toggle modal / drawer */}
      {showSystemSettings && (
        <div className="mb-3 p-4 rounded-2xl bg-white border border-emerald-200 shadow-xl shadow-emerald-500/10 animate-in fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-[#00d68f]" />
              <span>Custom Instructions (Optional)</span>
            </div>
            <button
              onClick={() => setShowSystemSettings(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Provide special persona or behavioral guidelines (e.g., <em>"Act as a Senior Python Architect"</em> or <em>"Respond concisely in bullet points"</em>).
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#00d68f] focus:ring-1 focus:ring-[#00d68f] font-sans resize-none"
            placeholder="Type your custom system instructions..."
          />
        </div>
      )}

      {/* Main Floating Input Card (Mint Glow Card) */}
      <div className="relative rounded-3xl bg-white border-2 border-[#bfeade] mint-input-glow transition-all p-2.5 sm:p-3 shadow-lg shadow-emerald-500/5">
        <div className="flex items-start gap-2">
          {/* Plus icon button on left */}
          <button
            type="button"
            onClick={() => setShowSystemSettings(!showSystemSettings)}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 transition-colors shrink-0 mt-0.5"
            title="Custom Instructions"
          >
            <Plus className="w-4 h-4" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={1}
            placeholder={
              isImageMode
                ? 'Describe the image you want to generate (e.g., Cyberpunk futuristic city with neon lights, 8k render)...'
                : 'Ask anything, write code, analyze data, or solve math problems (Enter to send)...'
            }
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 py-1.5 focus:outline-none resize-none text-xs sm:text-sm leading-relaxed max-h-40 overflow-y-auto"
          />
        </div>

        {/* Bottom Toolbar inside input */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Left tools: Model Selector pill & prompt button */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <ModelSelector
              selectedModelId={selectedModel}
              onSelectModel={onSelectModel}
              compact
            />

            <button
              type="button"
              onClick={() => setShowSystemSettings(!showSystemSettings)}
              className={`p-1.5 rounded-full transition-colors ${
                showSystemSettings || systemPrompt.trim()
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Custom Instructions"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right send / stop button */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim()}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                  input.trim()
                    ? isImageMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25 active:scale-95'
                      : 'bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 shadow-emerald-500/25 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title="Send"
              >
                {isImageMode ? (
                  <>
                    <span>Generate</span>
                    <ImageIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
