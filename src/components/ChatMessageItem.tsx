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
  provider,
  node,
  isStreaming,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);

  const isUser = role === 'user';

  // Parse <think>...</think> tags if DeepSeek R1 output contains reasoning
  let thinkingContent = '';
  let mainContent = content;

  const thinkMatch = content.match(/<think>([\s\S]*?)<\/think>/);
  if (thinkMatch) {
    thinkingContent = thinkMatch[1].trim();
    mainContent = content.replace(/<think>[\s\S]*?<\/think>/, '').trim();
  } else if (content.startsWith('<think>')) {
    // Ongoing thinking during stream
    const partialParts = content.split('<think>');
    if (partialParts.length > 1) {
      thinkingContent = partialParts[1].trim();
      mainContent = '';
    }
  }

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className={`flex w-full py-4 px-3 md:px-6 transition-colors ${
      isUser ? 'bg-[#0b0e17]/50' : 'bg-[#101420]/70 border-y border-[#182030]'
    }`}>
      <div className="max-w-4xl w-full mx-auto flex gap-3 md:gap-4">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-md">
              <User className="w-4 h-4" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 flex items-center justify-center text-white shadow-md animate-pulse-glow">
              <Bot className="w-4 h-4" />
            </div>
          )}
        </div>

        {/* Message Content */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header info */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-300">
                {isUser ? 'Siz' : 'iportal-ai'}
              </span>

              {/* Provider & Edge Node tag */}
              {!isUser && (provider || node) && (
                <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1b2336] text-[10px] text-blue-300 border border-[#2b3752]">
                  <Sparkles className="w-2.5 h-2.5 text-yellow-400" />
                  <span>{provider || 'Cluster'}</span>
                  {node && (
                    <>
                      <span className="text-gray-500">•</span>
                      <span className="text-gray-400">{node}</span>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Action buttons */}
            {!isStreaming && content && (
              <div className="flex items-center gap-1 opacity-70 hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopy}
                  className="p-1 rounded hover:bg-[#1f283d] text-gray-400 hover:text-white transition-all cursor-pointer"
                  title="Nusxa olish"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
                </button>
                {!isUser && onRetry && (
                  <button
                    onClick={onRetry}
                    className="p-1 rounded hover:bg-[#1f283d] text-gray-400 hover:text-white transition-all cursor-pointer"
                    title="Qayta urinish"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Reasoning / Thinking foldout (DeepSeek R1) */}
          {thinkingContent && (
            <div className="my-2 rounded-lg border border-purple-900/40 bg-purple-950/20 overflow-hidden">
              <button
                onClick={() => setShowThinking(!showThinking)}
                className="w-full flex items-center justify-between px-3 py-1.5 text-xs text-purple-300 hover:bg-purple-900/30 transition-colors text-left"
              >
                <div className="flex items-center gap-1.5 font-medium">
                  <BrainCircuit className="w-3.5 h-3.5 text-purple-400 animate-spin-slow" />
                  <span>Fikr yuritish jarayoni (Reasoning)</span>
                </div>
                {showThinking ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              </button>
              {(showThinking || isStreaming) && (
                <div className="p-3 text-xs text-purple-200/80 font-mono bg-[#0c0e18]/80 border-t border-purple-900/30 whitespace-pre-wrap leading-relaxed">
                  {thinkingContent}
                </div>
              )}
            </div>
          )}

          {/* Main Markdown Body */}
          <div className="markdown-body">
            {mainContent ? (
              <ReactMarkdown
                remarkPlugins={[remarkGfm, remarkMath]}
                rehypePlugins={[rehypeKatex]}
                components={{
                  code({ node, className, children, ...props }) {
                    const match = /language-(\w+)/.exec(className || '');
                    const isInline = !match && !String(children).includes('\n');
                    if (isInline) {
                      return (
                        <code className={className} {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <CodeBlock
                        language={match ? match[1] : 'text'}
                        value={String(children).replace(/\n$/, '')}
                      />
                    );
                  },
                }}
              >
                {mainContent}
              </ReactMarkdown>
            ) : isStreaming ? (
              <div className="flex items-center gap-2 text-sm text-gray-400 py-1">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
                <span>Javob tayyorlanmoqda...</span>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
