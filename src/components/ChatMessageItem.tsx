'use client';

import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import { 
  User, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  BrainCircuit, 
  Sparkles, 
  RefreshCw, 
  Download, 
  Image as ImageIcon, 
  FileText, 
  FileCode, 
  File as FileIcon,
  ShieldAlert
} from 'lucide-react';
import { CodeBlock } from './CodeBlock';
import { ChatAttachment } from '@/lib/core/types';

interface ChatMessageProps {
  role: 'user' | 'assistant' | 'system' | 'tool';
  content: string;
  attachments?: ChatAttachment[];
  provider?: string;
  node?: string;
  isStreaming?: boolean;
  onRetry?: (withoutAttachments?: boolean) => void;
}

export const ChatMessageItem: React.FC<ChatMessageProps> = ({
  role,
  content,
  attachments = [],
  isStreaming,
  onRetry,
}) => {
  const [copied, setCopied] = useState(false);
  const [showThinking, setShowThinking] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const isUser = role === 'user';

  // Check if assistant is currently generating an image
  const isImageGenerating = !isUser && (
    content.startsWith('🎨 Generating') || 
    (isStreaming && (content.includes('iportal Neural Engine') || content.includes('Generating high-resolution') || content.includes('Generating image')))
  );

  // Check if message is a system error
  const isErrorMessage = !isUser && (
    content.startsWith('⚠️') || 
    content.includes('error occurred') || 
    content.includes('yuqori yuklama') ||
    content.includes('rate_limit_exceeded') ||
    content.includes('Barcha bepul AI provayderlar') ||
    content.includes('Request too large') ||
    content.includes('error:')
  );

  const isFileError = isErrorMessage && (
    content.includes('fayl') || 
    content.includes('file') || 
    content.includes('Request too large') || 
    content.includes('413') ||
    content.includes('token')
  );

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

  const handleDownloadImage = async (src: string) => {
    try {
      const response = await fetch(src);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iportal-ai-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(src, '_blank');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div
      className={`group w-full transition-colors duration-200 py-3.5 sm:py-4.5 ${
        isUser
          ? 'bg-transparent'
          : 'bg-[#fafcfb] border-y border-[#eaf2ee]'
      }`}
    >
      <div className="max-w-4xl mx-auto px-4 md:px-6 flex gap-3.5 md:gap-4.5">
        {/* Avatar */}
        <div className="shrink-0 pt-0.5">
          {isUser ? (
            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-semibold shadow-sm">
              <User className="w-4 h-4 text-slate-200" />
            </div>
          ) : (
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d68f] to-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs text-slate-900 tracking-tight">
                {isUser ? 'You' : 'iportal-ai'}
              </span>
              {!isUser && (
                <span className="inline-flex items-center gap-1 text-[10px] text-emerald-700 font-semibold px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-200/60">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#00d68f] animate-pulse" />
                  Neural Assistant
                </span>
              )}
            </div>

            {/* Quick Actions (Copy / Retry) */}
            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
              <button
                onClick={handleCopy}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              {!isUser && onRetry && (
                <button
                  onClick={() => onRetry(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Regenerate response"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Reasoning / Thinking Box */}
          {thinkingContent && (
            <div className="rounded-xl border border-emerald-200/80 bg-emerald-50/40 overflow-hidden mb-2">
              <button
                type="button"
                onClick={() => setShowThinking(!showThinking)}
                className="w-full flex items-center justify-between px-3 py-2 text-xs text-emerald-800 hover:bg-emerald-100/40 transition-colors cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <BrainCircuit className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-[11px]">
                    Thought Process & Reasoning Trace
                  </span>
                </div>
                {showThinking ? <ChevronDown className="w-3.5 h-3.5 text-emerald-600" /> : <ChevronRight className="w-3.5 h-3.5 text-emerald-600" />}
              </button>

              {showThinking && (
                <div className="px-3 pb-3 pt-1 border-t border-emerald-200/60 text-xs text-emerald-950 font-mono whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto">
                  {thinkingContent}
                </div>
              )}
            </div>
          )}

          {/* Main Message Text / Markdown */}
          {isUser ? (
            <div className="space-y-2 inline-block max-w-3xl">
              {/* Render Attached Files / Images in User Message */}
              {attachments && attachments.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-1.5">
                  {attachments.map((att) => (
                    <div key={att.id}>
                      {att.type === 'image' && att.dataUrl ? (
                        <div 
                          onClick={() => setPreviewImage(att.dataUrl!)}
                          className="relative rounded-xl overflow-hidden border border-slate-300 max-w-[200px] max-h-[160px] cursor-pointer hover:opacity-90 shadow-xs"
                        >
                          <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-800 text-xs shadow-2xs">
                          {att.type === 'code' ? (
                            <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                          ) : (
                            <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          <div className="flex flex-col min-w-0">
                            <span className="font-bold truncate text-[11px] max-w-[180px]">{att.name}</span>
                            <span className="text-[9px] text-slate-400 font-mono">{formatFileSize(att.size)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {content && (
                <div className="text-sm text-slate-800 whitespace-pre-wrap leading-relaxed font-normal bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-xs">
                  {content}
                </div>
              )}
            </div>
          ) : isImageGenerating ? (
            /* High-Fidelity Animated Image Generation Skeleton */
            <div className="my-2 max-w-lg w-full rounded-3xl bg-[#0b101d] border border-emerald-500/25 shadow-2xl p-6 sm:p-8 relative overflow-hidden flex flex-col items-center justify-center text-center space-y-4">
              {/* Background ambient glow */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-[#00d68f]/15 rounded-full blur-2xl pointer-events-none" />
              <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-purple-500/15 rounded-full blur-2xl pointer-events-none" />

              {/* Glowing pulsating central icon */}
              <div className="relative">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#00d68f] via-[#059669] to-[#10b981] flex items-center justify-center text-slate-950 shadow-xl shadow-emerald-500/30 animate-pulse">
                  <Sparkles className="w-7 h-7 stroke-[2.2]" />
                </div>
              </div>

              <div className="space-y-1 z-10">
                <h4 className="text-sm sm:text-base font-extrabold text-white tracking-tight">
                  Synthesizing Neural Artwork...
                </h4>
                <p className="text-xs text-emerald-400 font-medium">
                  iportal Neural Diffusion Core is rendering your scene
                </p>
              </div>

              {/* Shimmering Progress Bar */}
              <div className="w-full max-w-xs h-2 bg-slate-800/80 rounded-full overflow-hidden p-0.5 border border-slate-700/50">
                <div className="h-full bg-gradient-to-r from-[#00d68f] via-emerald-400 to-[#00d68f] rounded-full animate-pulse w-full" />
              </div>

              <div className="text-[11px] text-slate-400">
                Rendering 1024×1024 high resolution • Please wait ~3-5 seconds
              </div>
            </div>
          ) : isErrorMessage ? (
            /* Elegant, Friendly Error Notice Card with Retry & Action Options */
            <div className="my-2 max-w-xl p-4 sm:p-5 rounded-2xl bg-amber-500/5 border border-amber-500/20 text-slate-800 space-y-3.5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-500/15 text-amber-600 shrink-0 mt-0.5">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div className="space-y-1 min-w-0">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900">
                    {isFileError 
                      ? "📄 Yuklangan Fayl Hajmi / Matni Katta"
                      : "⚡️ Neyrotizim ayni damda yuqori yuklama ostida"}
                  </h4>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {isFileError 
                      ? "Yuklangan fayl (PDF/Hujjat) hajmi yoki matni neyrotizimning bitta so'rovdagi xotirasidan oshib ketdi. Faylsiz qayta urinib ko'rishingiz yoki fayl ichidagi kerakli matndan nusxa olib yuborishingiz mumkin."
                      : "Kechirasiz, so'rovingizni qayta ishlashda vaqtinchalik to'siq yuzaga keldi. Iltimos, qayta urinib ko'ring yoki boshqa modelni tanlang."}
                  </p>
                </div>
              </div>

              {onRetry && (
                <div className="flex flex-wrap items-center gap-2 pt-1 pl-10">
                  <button
                    type="button"
                    onClick={() => onRetry(false)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-[#00d68f] to-[#059669] text-slate-950 font-bold text-xs hover:from-[#00c483] hover:to-[#04825b] shadow-xs transition-all cursor-pointer"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Qayta urinish</span>
                  </button>

                  {isFileError && (
                    <button
                      type="button"
                      onClick={() => onRetry(true)}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs transition-all cursor-pointer border border-slate-200"
                      title="Faylni olib tashlab, faqat yozilgan matn bilan qayta yuborish"
                    >
                      <span>🗑 Faylsiz Qayta Urinish</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="markdown-body text-sm leading-relaxed text-slate-800">
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
                        <code className="px-1.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 font-mono text-[12px] border border-emerald-200/80 font-medium" {...props}>
                          {children}
                        </code>
                      );
                    },
                    img({ src, alt, ...props }: any) {
                      if (!src) return null;
                      return (
                        <div className="my-3 rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 shadow-md max-w-lg">
                          <img
                            src={src}
                            alt={alt || 'iportal Image'}
                            className="w-full h-auto object-contain max-h-96 cursor-pointer hover:opacity-95 transition-opacity"
                            onClick={() => setPreviewImage(src)}
                            loading="lazy"
                          />
                          <div className="p-2.5 bg-slate-900 flex items-center justify-between text-xs text-white">
                            <span className="text-[11px] text-slate-400 font-medium truncate max-w-xs">{alt || 'iportal Image'}</span>
                            <button
                              onClick={() => handleDownloadImage(src)}
                              className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-[#00d68f] text-slate-950 font-bold text-[11px] hover:bg-[#00bf80] transition-colors cursor-pointer"
                            >
                              <Download className="w-3.5 h-3.5" />
                              <span>Download</span>
                            </button>
                          </div>
                        </div>
                      );
                    }
                  }}
                >
                  {mainContent}
                </ReactMarkdown>
              ) : isStreaming ? (
                <div className="flex items-center gap-2 py-1 text-xs text-emerald-600 font-semibold">
                  <span className="w-2 h-2 rounded-full bg-[#00d68f] animate-ping" />
                  <span>Thinking & generating response...</span>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Modal */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)}
          className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm cursor-pointer animate-in fade-in"
        >
          <div className="relative max-w-3xl max-h-[85vh] rounded-3xl overflow-hidden shadow-2xl">
            <img src={previewImage} alt="Preview" className="max-h-[85vh] w-auto object-contain rounded-3xl" />
          </div>
        </div>
      )}
    </div>
  );
};
