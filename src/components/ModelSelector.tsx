'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Code, Check, ShieldCheck } from 'lucide-react';
import { IPORTAL_MODELS } from '@/lib/core/models';
import { AIModelMeta } from '@/lib/core/types';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const selectedModel = IPORTAL_MODELS.find(m => m.id === selectedModelId) || IPORTAL_MODELS[0];

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getCategoryIcon = (category: AIModelMeta['category']) => {
    switch (category) {
      case 'fast':
        return <Zap className="w-3.5 h-3.5 text-amber-400" />;
      case 'reasoning':
        return <Brain className="w-3.5 h-3.5 text-purple-400" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-emerald-400" />;
      case 'smart':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#0f1422] hover:bg-[#141b2c] border border-[#1e283d] text-xs text-slate-200 transition-all shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {getCategoryIcon(selectedModel.category)}
          <span className="font-semibold text-slate-100 tracking-tight">
            {selectedModel.name}
          </span>
        </div>
        <span className="px-1.5 py-0.2 text-[10px] font-mono bg-blue-500/10 text-cyan-400 rounded border border-blue-500/20">
          {selectedModel.speed}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 md:w-96 rounded-2xl bg-[#0d121f] border border-[#1f2a40] shadow-2xl shadow-black/80 z-50 overflow-hidden py-1 max-h-[480px] overflow-y-auto">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-[#1b253b] flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              iportal-ai Neyron Modellar
            </span>
            <div className="flex items-center gap-1 text-[11px] text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Optimizatsiya qilingan</span>
            </div>
          </div>

          {/* Model List */}
          <div className="p-1.5 space-y-1">
            {IPORTAL_MODELS.map(model => {
              const isSelected = model.id === selectedModel.id;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-blue-600/15 border border-blue-500/40 text-white shadow-sm' 
                      : 'hover:bg-[#131929] text-slate-300 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-[#151c2d] border border-[#212c42] shrink-0">
                    {getCategoryIcon(model.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">
                        {model.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-400 bg-[#080c14] px-1.5 py-0.2 rounded border border-[#1b253b]">
                        {model.speed}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-cyan-400 mt-1 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
