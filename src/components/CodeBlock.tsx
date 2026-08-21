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
    <div className="relative my-3.5 rounded-2xl overflow-hidden border border-[#1a2337] bg-[#070a12] font-mono text-xs md:text-sm shadow-xl shadow-black/40">
      {/* Mac OS Styled Header */}
      <div className="flex items-center justify-between px-3.5 py-2 bg-[#0d121f] border-b border-[#172033] text-xs text-slate-400 select-none">
        <div className="flex items-center gap-3">
          {/* Mac OS Window dots */}
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500/80 border border-red-400/30 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80 border border-amber-400/30 inline-block" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 border border-emerald-400/30 inline-block" />
          </div>
          <div className="flex items-center gap-1.5 pl-1">
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span className="font-semibold text-slate-300 uppercase tracking-wider text-[10px] md:text-[11px]">
              {language}
            </span>
          </div>
        </div>

        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#141b2c] hover:bg-[#1d273e] text-slate-300 hover:text-white border border-[#1f2b45] transition-all text-xs cursor-pointer shadow-sm active:scale-95"
          title="Kodni nusxalash"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-emerald-400 text-[11px] font-medium">Nusxalandi</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Nusxa</span>
            </>
          )}
        </button>
      </div>

      {/* Code Content */}
      <div className="p-4 overflow-x-auto text-[12px] md:text-[13px] leading-relaxed text-slate-200 selection:bg-cyan-500/30 selection:text-white">
        <pre className="!m-0 !p-0 !bg-transparent font-mono whitespace-pre">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
