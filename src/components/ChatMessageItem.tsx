'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { Bot, User, Copy, Check, ChevronDown, ChevronRight, BrainCircuit, Sparkles, RefreshCw } from 'lucide-react';
import { CodeBlock } from './CodeBlock';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  provider?: string;
  node?: string;
  isStreaming?: boolean;
  onRetry?: () => void;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  role,
  content,
  isStreaming,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const isUser = role === 'user';

  // Parse <think>...</think> tags for reasoning mode
  let thinkingContent = '';
  let mainContent = content;

  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  } else if (content.startsWith('<think>')) {
    const partialParts = content.split('<think>');
    if (partialParts.length > 1) {
      thinkingContent = partialParts[1].trim();
      mainContent = '';
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(mainContent || content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div
      className={`group w-full border-b transition-colors duration-200 ${
        isUser
          ? 'bg-transparent border-[#151c2e]/60'
          : 'bg-[#0a0d16]/70 border-[#151c2e]/80'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-5 flex gap-4 md:gap-5">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white text-xs font-semibold shadow-sm border border-slate-500/30">
              <User className="w-4 h-4 text-slate-200" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20 border border-blue-400/30">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-2.5">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-slate-200 tracking-tight">
                {isUser ? 'Siz' : 'iportal-ai'}
              </span>
              {!isUser && (
                <span className="inline-flex items-center gap-1 text-[10px] text-cyan-400/90 font-medium px-1.5 py-0.2 rounded bg-cyan-950/40 border border-cyan-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
                  Intellekt
                </span>
              )}
            </div>

            {/* Quick Actions (Copy / Retry) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#161f32] transition-colors"
                title="Nusxa olish"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {!isUser && onRetry && (
                <button
                  onClick={onRetry}
                  className="p-1 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-[#161f32] transition-colors"
                  title="Qayta generatsiya qilish"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Reasoning / Thinking Box */}
          {thinkingContent && (
            <div className="rounded-xl border border-indigo-900/30 bg-gradient-to-r from-indigo-950/20 to-blue-950/20 overflow-hidden mb-2">
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-indigo-300/90 hover:bg-indigo-950/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                  <span className="font-medium text-[11px]">
                    Fikrlash jarayoni (Mulohaza)
                  </span>
                </div>
                {showThinking ? <ChevronDown className="w-3.5 h-3.5 text-indigo-400" /> : <ChevronRight className="w-3.5 h-3.5 text-indigo-400" />}
              </button>

              {showThinking && (
                <div className="px-3 pb-3 pt-1 border-t border-indigo-900/20 text-xs text-indigo-200/70 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {thinkingContent}
                </div>
              )}
            </div>
          )}

          {/* Main Message Text / Markdown */}
          {isUser ? (
            <div className="text-sm text-slate-100 whitespace-pre-wrap leading-relaxed font-normal">
              {content}
            </div>
          ) : (
            <div className="markdown-body text-sm leading-relaxed text-slate-200">
              {mainContent ? (
                <ReactMarkdown
                  remarkPlugins={[remarkGfm, remarkMath]}
                  rehypePlugins={[rehypeKatex]}
                  components={{
                    code({ inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeString = String(children).replace(/\n$/, '');

                      if (!inline && match) {
                        return (
                          <CodeBlock
                            language={match[1]}
                            value={codeString}
                          />
                        );
                      } else if (!inline && codeString.includes('\n')) {
                        return (
                          <CodeBlock
                            language="text"
                            value={codeString}
                          />
                        );
                      }

                      return (
                        <code className="px-1.5 py-0.5 rounded bg-blue-950/50 text-blue-300 font-mono text-[12px] border border-blue-900/40" {...props}>
                          {children}
                        </code>
                      );
                    },
                  }}
                >
                  {mainContent}
                </ReactMarkdown>
              ) : isStreaming ? (
                <div className="flex items-center gap-1.5 py-1 text-xs text-cyan-400 font-medium">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>Javob tayyorlanmoqda...</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
