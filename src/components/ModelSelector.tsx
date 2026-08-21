'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Sparkles, Zap, Brain, Code, ShieldCheck, Check } from 'lucide-react';
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
        return <Zap className="w-4 h-4 text-amber-400" />;
      case 'reasoning':
        return <Brain className="w-4 h-4 text-purple-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-emerald-400" />;
      case 'smart':
      default:
        return <Sparkles className="w-4 h-4 text-blue-400" />;
    }
  };

  const virtualModels = IPORTAL_MODELS.filter(m => m.id.startsWith('iportal-ai'));
  const directModels = IPORTAL_MODELS.filter(m => !m.id.startsWith('iportal-ai'));

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-[#141926] hover:bg-[#1c2436] border border-[#232d42] text-sm text-gray-200 transition-all shadow-sm cursor-pointer"
      >
        <div className="flex items-center gap-2">
          {getCategoryIcon(selectedModel.category)}
          <span className="font-semibold text-white tracking-wide text-xs md:text-sm">
            {selectedModel.name}
          </span>
        </div>
        <span className="px-1.5 py-0.5 text-[10px] font-mono bg-blue-500/20 text-blue-300 rounded border border-blue-500/30">
          {selectedModel.speed}
        </span>
        <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-80 md:w-96 rounded-xl glass-dropdown z-50 overflow-hidden py-1.5 max-h-[480px] overflow-y-auto">
          {/* Header */}
          <div className="px-3 py-2 border-b border-[#232d42] flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider">
              iportal-ai Modellar Klasteri
            </span>
            <div className="flex items-center gap-1 text-[11px] text-green-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>100% Bepul</span>
            </div>
          </div>

          {/* Virtual Smart Modes */}
          <div className="px-2 py-1.5">
            <div className="text-[10px] uppercase font-bold text-blue-400/90 px-2 py-1">
              Asosiy Modellar (Smart Failover)
            </div>
            {virtualModels.map(model => {
              const isSelected = model.id === selectedModel.id;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start gap-2.5 p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'hover:bg-[#1a2233] text-gray-300'
                  }`}
                >
                  <div className="mt-0.5 shrink-0">
                    {getCategoryIcon(model.category)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-xs text-white truncate">
                        {model.name}
                      </span>
                      <span className="text-[10px] font-mono text-cyan-300 bg-[#121928] px-1.5 py-0.5 rounded border border-[#232f48]">
                        {model.speed}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 mt-0.5 leading-snug">
                      {model.description}
                    </p>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-400 mt-1 shrink-0" />}
                </button>
              );
            })}
          </div>

          {/* Direct Provider Models */}
          <div className="px-2 py-1.5 border-t border-[#1e2638]">
            <div className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1">
              Provayderga To\'g\'ridan-to\'g\'ri Ulanish
            </div>
            {directModels.map(model => {
              const isSelected = model.id === selectedModel.id;
              return (
                <button
                  key={model.id}
                  onClick={() => {
                    onSelectModel(model.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-lg text-left transition-colors cursor-pointer ${
                    isSelected ? 'bg-blue-600/20 border border-blue-500/40 text-white' : 'hover:bg-[#1a2233] text-gray-300'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="text-xs font-medium text-gray-200 truncate">{model.name}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[10px] text-gray-400 font-mono">{model.speed}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
