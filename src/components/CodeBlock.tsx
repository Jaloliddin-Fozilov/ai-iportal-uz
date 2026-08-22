'use client';

import React, { useState } from 'react';
import { Check, Copy, Terminal } from 'lucide-react';

interface CodeBlockProps {
  language?: string;
  value: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({ language = 'text', value }) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Nusxalashda xatolik:', err);
    }
  };

  return (
    <div className="relative my-4 rounded-2xl overflow-hidden border border-slate-800 bg-[#0c121e] font-mono text-xs md:text-sm shadow-xl shadow-slate-900/10">
      {/* Mac OS Styled Header */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-[#141d2e] border-b border-slate-800/80 text-xs text-slate-400 select-none">
        <div className="flex items-center gap-3">
          {/* Mac OS Window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff5f56] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffbd2e] inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-[#27c93f] inline-block" />
          </div>
          <div className="flex items-center gap-1.5 pl-1.5 border-l border-slate-700/60">
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span className="font-semibold text-slate-200 uppercase tracking-wider text-[11px]">
              {language}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700/60 transition-all text-xs cursor-pointer active:scale-95"
          title="Kodni nusxalash"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px] font-semibold">Nusxalandi</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium">Nusxa</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[12px] md:text-[13px] leading-relaxed text-slate-100 selection:bg-emerald-500/30 selection:text-white">
        <pre className="!m-0 !p-0 !bg-transparent font-mono whitespace-pre">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
