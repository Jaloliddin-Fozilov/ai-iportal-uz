'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Code, Check, Cpu } from 'lucide-react';
import { IPORTAL_MODELS } from '@/lib/core/models';
import { AIModelMeta } from '@/lib/core/types';

interface ModelSelectorProps {
  selectedModelId: string;
  onSelectModel: (modelId: string) => void;
  compact?: boolean;
}

export const ModelSelector: React.FC<ModelSelectorProps> = ({
  selectedModelId,
  onSelectModel,
  compact = false,
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
        return <Zap className="w-3.5 h-3.5 text-amber-500" />;
      case 'reasoning':
        return <Brain className="w-3.5 h-3.5 text-purple-500" />;
      case 'code':
        return <Code className="w-3.5 h-3.5 text-emerald-600" />;
      case 'smart':
      default:
        return <Sparkles className="w-3.5 h-3.5 text-[#00d68f]" />;
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-100/90 hover:bg-slate-200/80 text-xs font-bold text-slate-800 transition-all shadow-2xs border border-slate-200/80 cursor-pointer"
      >
        <div className="p-0.5 rounded-full bg-white shadow-2xs">
          <Cpu className="w-3.5 h-3.5 text-emerald-600" />
        </div>
        <span className="truncate max-w-[130px] sm:max-w-[180px]">
          {selectedModel.name}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 bottom-full mb-2 w-72 sm:w-80 rounded-2xl bg-white border border-slate-200 shadow-2xl shadow-slate-900/15 z-50 overflow-hidden py-1">
          {/* Header */}
          <div className="px-3.5 py-2.5 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              Neyron Modellar Klasteri
            </span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 font-mono">
              v1.0
            </span>
          </div>

          {/* Model List */}
          <div className="p-1.5 space-y-1 max-h-64 overflow-y-auto">
            {IPORTAL_MODELS.map(model => {
              const isSelected = model.id === selectedModel.id;
              return (
                <button
                  type="button"
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                    isSelected 
                      ? 'bg-emerald-50/80 border border-emerald-300 text-slate-900 shadow-xs' 
                      : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                  }`}
                >
                  <div className="mt-0.5 p-1.5 rounded-lg bg-white border border-slate-200 shrink-0 shadow-2xs">
                    {getCategoryIcon(model.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-xs text-slate-900 truncate">
                        {model.name}
                      </span>
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold bg-emerald-100/60 px-1.5 py-0.2 rounded">
                        {model.speed}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5 leading-snug">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 mt-1 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
