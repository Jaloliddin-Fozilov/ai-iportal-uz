'use client';

import React, { useState } from 'react';
import { X, Image as ImageIcon, Sparkles, Download, RefreshCw, Wand2, Check } from 'lucide-react';

interface ImageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ImageModal: React.FC<ImageModalProps> = ({ isOpen, onClose }) => {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16'>('1:1');
  const [loading, setLoading] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const samplePrompts = [
    'Futuristik Toshkent 2050-yil, baland osmono\'par binolar, neon chiroqlar, kiberpank, 8K ultra aniq',
    'Samarqand Registon maydoni kosmik kelajak uslubida, yulduzli osmon, fotorealistik san\'at',
    'AI robot dasturchi kompyuter oldida zamonaviy ofisda, yorqin yashil neon aksentlar, 3D render',
    'O\'zbekiston tabiati, Chotqol tog\'lari ustida quyosh botishi, kinematografik, photorealistic',
  ];

  const handleGenerate = async (customPrompt?: string) => {
    const textToUse = customPrompt || prompt;
    if (!textToUse.trim()) return;

    setLoading(true);
    setError(null);

    let width = 1024;
    let height = 1024;
    if (aspectRatio === '16:9') {
      width = 1280;
      height = 720;
    } else if (aspectRatio === '9:16') {
      width = 720;
      height = 1280;
    }

    try {
      const res = await fetch('/api/v1/images/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: textToUse.trim(),
          width,
          height,
          model: 'flux',
        }),
      });

      const data = await res.json();
      if (data.success && data.imageUrl) {
        setGeneratedImage(data.imageUrl);
      } else {
        throw new Error(data.error || 'Rasm generatsiya qilib bo\'lmadi');
      }
    } catch (e: any) {
      setError(e.message || 'Xatolik yuz berdi');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!generatedImage) return;
    try {
      const response = await fetch(generatedImage);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `iportal-ai-image-${Date.now()}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      window.open(generatedImage, '_blank');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-2xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-[#00d68f]/15 text-emerald-700">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">iportal Image AI (Flux Studio)</h2>
              <p className="text-xs text-slate-500">Matndan yuqori sifatli (8K Flux) AI rasmlar yaratish</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {/* Prompt input */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700">Rasm Tavsifi (Prompt)</label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={3}
                placeholder="Rasmda nima tasvirlanishini yozing (masalan: Kiberpank uslubidagi zamonaviy avtomobil, neon chiroqlar)..."
                className="w-full p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#00d68f] focus:ring-1 focus:ring-[#00d68f] resize-none"
              />
            </div>
          </div>

          {/* Aspect Ratio & Controls */}
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={() => setAspectRatio('1:1')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === '1:1' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                1:1 (Kvadrat)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('16:9')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === '16:9' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                16:9 (Landscape)
              </button>
              <button
                type="button"
                onClick={() => setAspectRatio('9:16')}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                  aspectRatio === '9:16' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                9:16 (Story)
              </button>
            </div>

            <button
              onClick={() => handleGenerate()}
              disabled={loading || !prompt.trim()}
              className="flex items-center gap-2 px-6 py-2.5 rounded-2xl bg-[#00d68f] hover:bg-[#00bf80] disabled:opacity-50 text-slate-950 font-bold text-xs shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Yaratilmoqda...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Rasm Yaratish</span>
                </>
              )}
            </button>
          </div>

          {/* Sample Prompts */}
          <div className="space-y-1.5 pt-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Namuna Promtlar:</span>
            <div className="flex flex-wrap gap-1.5">
              {samplePrompts.map((sp, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    setPrompt(sp);
                    handleGenerate(sp);
                  }}
                  className="px-2.5 py-1 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-[11px] text-slate-600 text-left transition-colors cursor-pointer truncate max-w-full"
                >
                  ✨ {sp}
                </button>
              ))}
            </div>
          </div>

          {/* Error display */}
          {error && (
            <div className="p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-700">
              {error}
            </div>
          )}

          {/* Generated Image Result */}
          {generatedImage && (
            <div className="pt-3 border-t border-slate-100 space-y-3">
              <div className="relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-950 flex items-center justify-center max-h-96 group shadow-lg">
                <img
                  src={generatedImage}
                  alt="Generated AI art"
                  className="w-full h-auto object-contain max-h-96"
                  loading="lazy"
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500 font-medium">Model: <strong>Flux 8K AI</strong></span>
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Yuklab Olish (Download)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
