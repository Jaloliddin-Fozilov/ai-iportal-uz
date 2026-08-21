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
    <div className="relative my-3 rounded-lg overflow-hidden border border-[#232b3e] bg-[#0c101a] font-mono text-sm shadow-lg">
      {/* Code Header */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#141926] border-b border-[#232b3e] text-xs text-gray-400">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-blue-400" />
          <span className="font-semibold text-gray-300 uppercase tracking-wider text-[11px]">
            {language}
          </span>
        </div>
        <button
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2 py-1 rounded bg-[#1e2638] hover:bg-[#2a364e] text-gray-300 hover:text-white transition-all text-xs cursor-pointer"
          title="Nusxa olish"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-green-400" />
              <span className="text-green-400 text-[11px]">Nusxalandi</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px]">Nusxa olish</span>
            </>
          )}
        </button>
      </div>

      {/* Code Body */}
      <div className="p-3.5 overflow-x-auto text-[13px] leading-relaxed text-gray-200">
        <pre className="!m-0 !p-0 !bg-transparent">
          <code>{value}</code>
        </pre>
      </div>
    </div>
  );
};
