'use client';

import React, { useState, useEffect } from 'react';
import { X, Image as ImageIcon, Download, Trash2, Clock, Sparkles, AlertCircle, Eye } from 'lucide-react';
import { getGalleryImages, deleteGalleryImage, GalleryImageItem } from '@/lib/storage/clientGalleryStore';

interface LibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartImageChat?: () => void;
}

export const LibraryModal: React.FC<LibraryModalProps> = ({ isOpen, onClose, onStartImageChat }) => {
  const [images, setImages] = useState<GalleryImageItem[]>([]);
  const [selectedImage, setSelectedImage] = useState<GalleryImageItem | null>(null);

  useEffect(() => {
    if (isOpen) {
      setImages(getGalleryImages());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!confirm('Are you sure you want to delete this image from your library?')) return;
    deleteGalleryImage(id);
    setImages(getGalleryImages());
    if (selectedImage?.id === id) setSelectedImage(null);
  };

  const handleDownload = async (imgUrl: string, prompt: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const response = await fetch(imgUrl);
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
      window.open(imgUrl, '_blank');
    }
  };

  const getDaysRemaining = (createdAt: number) => {
    const elapsed = Date.now() - createdAt;
    const remaining = Math.max(0, Math.ceil((30 * 24 * 60 * 60 * 1000 - elapsed) / (24 * 60 * 60 * 1000)));
    return remaining;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in">
      <div className="relative w-full max-w-4xl max-h-[92vh] bg-white border border-slate-200 rounded-3xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-[#f8faf9]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-purple-100 text-purple-700">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 tracking-tight">Artwork Library & Gallery</h2>
              <p className="text-xs text-slate-500">Your AI-generated images and creations</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 30-Day Retention Notice Banner */}
        <div className="px-4 sm:px-6 pt-4">
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 flex items-start gap-3 text-xs text-amber-900">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-bold">30-Day Retention Policy:</span> Artworks in your library are stored for <strong>30 days</strong> and automatically cleaned up afterwards. Please download any files you want to keep permanently.
            </div>
          </div>
        </div>

        {/* Gallery Grid */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {images.length === 0 ? (
            <div className="py-16 text-center space-y-3">
              <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="text-sm font-bold text-slate-800">No images generated yet</h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Switch to Image Studio or type an image prompt in chat to generate your first AI artwork.
              </p>
              {onStartImageChat && (
                <button
                  onClick={() => {
                    onClose();
                    onStartImageChat();
                  }}
                  className="mt-2 inline-flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 font-bold text-xs shadow-md cursor-pointer transition-all"
                >
                  <Sparkles className="w-4 h-4" />
                  <span>Start Image Chat</span>
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {images.map((img) => {
                const daysLeft = getDaysRemaining(img.createdAt);
                return (
                  <div
                    key={img.id}
                    onClick={() => setSelectedImage(img)}
                    className="group relative rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 hover:shadow-lg transition-all cursor-pointer flex flex-col"
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-slate-900">
                      <img
                        src={img.url}
                        alt={img.prompt}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                        <button
                          onClick={(e) => handleDownload(img.url, img.prompt, e)}
                          className="p-2 rounded-xl bg-white/90 text-slate-900 hover:bg-white transition-colors"
                          title="Download"
                        >
                          <Download className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => handleDelete(img.id, e)}
                          className="p-2 rounded-xl bg-red-600/90 text-white hover:bg-red-600 transition-colors"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <div className="p-3 space-y-1.5 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-slate-800 line-clamp-2 leading-snug font-medium">
                        {img.prompt}
                      </p>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1 border-t border-slate-100">
                        <span className="font-mono">{img.model || 'Flux AI'}</span>
                        <span className="flex items-center gap-1 text-amber-700 font-semibold bg-amber-50 px-1.5 py-0.5 rounded">
                          <Clock className="w-3 h-3" />
                          {daysLeft}d left
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Lightbox Preview Modal */}
      {selectedImage && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="relative max-w-3xl w-full bg-white rounded-3xl overflow-hidden shadow-2xl space-y-3 p-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-bold text-slate-700 truncate max-w-lg">{selectedImage.prompt}</span>
              <button
                onClick={() => setSelectedImage(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="rounded-2xl overflow-hidden bg-black max-h-[70vh] flex items-center justify-center">
              <img src={selectedImage.url} alt={selectedImage.prompt} className="max-h-[70vh] w-auto object-contain" />
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-xs text-slate-500">{getDaysRemaining(selectedImage.createdAt)} days remaining in library</span>
              <button
                onClick={() => handleDownload(selectedImage.url, selectedImage.prompt)}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Download High-Res (JPG)</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
