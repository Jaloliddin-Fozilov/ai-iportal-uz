'use client';

import React, { useState } from 'react';
import { X, BookOpen, Sparkles, Code, Compass, Brain, Zap, Send, Copy, Check } from 'lucide-react';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPrompt: (prompt: string, modelId?: string) => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onSelectPrompt }) => {
  const [activeCategory, setActiveCategory] = useState<'all' | 'code' | 'business' | 'writing' | 'logic'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const libraryItems = [
    {
      id: 'code-1',
      category: 'code',
      title: 'REST API Arxitekturasi (FastAPI / Node.js)',
      desc: 'Ma\'lumotlar bazasi, JWT autentifikatsiya va xavfsizlik qoidalari bilan to\'liq REST API loyihasini yaratish.',
      prompt: 'Menga PostgreSQL va JWT autentifikatsiya bilan ishlaydigan xavfsiz va skalalanuvchi REST API arxitekturasini bosqichma-bosqich yozib ber.',
      model: 'iportal-ai-coder',
      icon: <Code className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'code-2',
      category: 'code',
      title: 'Kodni Refaktoring & Optimallashtirish',
      desc: 'Mavjud kodni Clean Code tamoyillari asosida qayta ishlash, tezligini oshirish va xatoliklarni bartaraf etish.',
      prompt: 'Quyidagi kodni Clean Code, SOLID tamoyillari va eng yaxshi amaliyotlar asosida refaktoring qilib, kamchiliklarini tushuntirib ber:\n\n[Kodingizni shu yerga qo\'ying]',
      model: 'iportal-ai-coder',
      icon: <Code className="w-4 h-4 text-emerald-600" />,
    },
    {
      id: 'biz-1',
      category: 'business',
      title: 'Startap Biznes Rejasi & Bozor Tahlili',
      desc: 'Yangi g\'oya uchun SWOT tahlil, maqsadli auditoriya, daromad modeli va marketing strategiyasi.',
      prompt: 'Mening yangi startap loyiham uchun batafsil biznes reja, SWOT tahlil, daromad manbalari va raqobatchilar tahlilini tuzib ber:\n\nLoyiham: [G\'oyangizni yozing]',
      model: 'iportal-ai-pro',
      icon: <Compass className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'biz-2',
      category: 'business',
      title: 'B2B Sotuv & Investitsion Pitch Deck',
      desc: 'Investorlar va mijozlar uchun 10 ta slayddan iborat kuchli taqdimot matni tuzilishi.',
      prompt: 'Investorlar uchun kuchli va ta\'sirchan 10 ta slayddan iborat Pitch Deck strukturasini har bir slayd matni bilan tayyorlab ber.',
      model: 'iportal-ai-pro',
      icon: <Compass className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'write-1',
      category: 'writing',
      title: 'Professional Maqola & SEO Kopirayting',
      desc: 'Google qidiruvida yuqori o\'rin oluvchi, qiziqarli va professional ilmiy/texnologik maqola.',
      prompt: 'Mavzu bo\'yicha yuqori sifatli, SEO optimallashgan va qiziqarli tildagi 1000 so\'zlik professional maqola yozib ber:\n\nMavzu: [Mavzuni kiriting]',
      model: 'iportal-ai',
      icon: <Sparkles className="w-4 h-4 text-amber-600" />,
    },
    {
      id: 'logic-1',
      category: 'logic',
      title: 'Murakkab Muammoni Bosqichma-bosqich Yechish',
      desc: 'Mantiqiy, matematik yoki tizimli tahlil talab qiluvchi muammolarni First Principles asosida yechish.',
      prompt: 'Ushbu murakkab masalani "First Principles" (Asosiy qoidalar) metodi orqali bosqichma-bosqich, har bir xulosaning asosini ko\'rsatib tahlil qil:\n\nMasala: [Savolingizni yozing]',
      model: 'iportal-ai-reasoning',
      icon: <Brain className="w-4 h-4 text-purple-600" />,
    },
  ];

  const filteredItems = activeCategory === 'all' 
    ? libraryItems 
    : libraryItems.filter(item => item.category === activeCategory);

  const handleCopy = async (text: string, id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <BookOpen className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Promtlar Kutubxonasi (Библиотека)</h2>
              <p className="text-xs text-slate-500">Tayyor professional shablonlar va samaradorlik formulalari</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Category switcher */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-100 bg-[#fafcfb] overflow-x-auto">
          {[
            { id: 'all', label: 'Barchasi' },
            { id: 'code', label: 'Dasturlash' },
            { id: 'business', label: 'Biznes' },
            { id: 'writing', label: 'Matn & SEO' },
            { id: 'logic', label: 'Mantiq & Tahlil' },
          ].map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                activeCategory === cat.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-white text-slate-600 hover:text-slate-900 border border-slate-200'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Templates Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {filteredItems.map(item => (
              <div
                key={item.id}
                onClick={() => {
                  onSelectPrompt(item.prompt, item.model);
                  onClose();
                }}
                className="group p-4 rounded-2xl bg-slate-50/80 hover:bg-white border border-slate-200 hover:border-emerald-300 shadow-2xs hover:shadow-md transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="p-1.5 rounded-xl bg-white border border-slate-200 shadow-2xs">
                      {item.icon}
                    </div>
                    <button
                      onClick={(e) => handleCopy(item.prompt, item.id, e)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                      title="Promtni nusxalash"
                    >
                      {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <div>
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 group-hover:text-emerald-700 transition-colors">
                      {item.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </div>

                <div className="mt-3 pt-2.5 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                  <span className="font-mono text-emerald-700 font-semibold">{item.model}</span>
                  <span className="font-bold text-slate-700 group-hover:text-emerald-600 flex items-center gap-1">
                    Ishlatish →
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
