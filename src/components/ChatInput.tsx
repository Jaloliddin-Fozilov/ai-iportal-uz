'use client';

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Square, 
  Sparkles, 
  Plus, 
  ArrowUp, 
  Wand2, 
  Image as ImageIcon, 
  Paperclip, 
  X, 
  FileText, 
  FileCode, 
  File as FileIcon 
} from 'lucide-react';
import { ModelSelector } from './ModelSelector';
import { ChatAttachment } from '@/lib/core/types';

interface ChatInputProps {
  onSendMessage: (message: string, attachments?: ChatAttachment[]) => void;
  onStop: () => void;
  isStreaming: boolean;
  systemPrompt: string;
  onUpdateSystemPrompt: (prompt: string) => void;
  selectedModel: string;
  onSelectModel: (modelId: string) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  onStop,
  isStreaming,
  systemPrompt,
  onUpdateSystemPrompt,
  selectedModel,
  onSelectModel,
}) => {
  const [input, setInput] = useState('');
  const [showSystemSettings, setShowSystemSettings] = useState(false);
  const [attachments, setAttachments] = useState<ChatAttachment[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const isImageMode = selectedModel === 'iportal-image' || selectedModel === 'image-flux';

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [input]);

  const processFiles = async (files: FileList | File[]) => {
    const newAttachments: ChatAttachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > 25 * 1024 * 1024) {
        alert(`File "${file.name}" is too large (max 25MB).`);
        continue;
      }

      const isImage = file.type.startsWith('image/');
      const isCode = /\.(js|ts|tsx|jsx|py|html|css|json|sql|cpp|c|java|go|rs|php|sh|yaml|yml|md)$/i.test(file.name);
      
      const attachment: ChatAttachment = {
        id: `att-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        name: file.name,
        type: isImage ? 'image' : isCode ? 'code' : 'document',
        mimeType: file.type || 'application/octet-stream',
        size: file.size,
      };

      try {
        if (isImage) {
          const dataUrl = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });
          attachment.dataUrl = dataUrl;
        } else {
          // Read text / code / document content
          const text = await new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = reject;
            reader.readAsText(file);
          });
          attachment.content = text;
        }
        newAttachments.push(attachment);
      } catch (err) {
        console.error('Failed to read file:', file.name, err);
      }
    }

    if (newAttachments.length > 0) {
      setAttachments(prev => [...prev, ...newAttachments]);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
      e.target.value = '';
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files && e.clipboardData.files.length > 0) {
      processFiles(e.clipboardData.files);
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if ((!input.trim() && attachments.length === 0) || isStreaming) return;

    onSendMessage(input.trim(), attachments.length > 0 ? attachments : undefined);
    setInput('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="w-full max-w-4xl mx-auto px-3 sm:px-6 pb-4">
      {/* Hidden File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        multiple
        accept="image/*,.pdf,.txt,.doc,.docx,.json,.csv,.js,.ts,.tsx,.jsx,.py,.html,.css,.md,.sql,.log,.yaml,.yml"
        className="hidden"
      />

      {/* System prompt toggle modal / drawer */}
      {showSystemSettings && (
        <div className="mb-3 p-4 rounded-2xl bg-white border border-emerald-200 shadow-xl shadow-emerald-500/10 animate-in fade-in space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-800">
              <Sparkles className="w-4 h-4 text-[#00d68f]" />
              <span>Custom Instructions (Optional)</span>
            </div>
            <button
              onClick={() => setShowSystemSettings(false)}
              className="text-xs text-slate-400 hover:text-slate-700 font-semibold cursor-pointer"
            >
              Close
            </button>
          </div>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Provide special persona or guidelines (e.g., <em>"Act as a Senior Python Architect"</em> or <em>"Respond concisely"</em>).
          </p>
          <textarea
            value={systemPrompt}
            onChange={(e) => onUpdateSystemPrompt(e.target.value)}
            rows={2}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-800 focus:outline-none focus:border-[#00d68f] focus:ring-1 focus:ring-[#00d68f] font-sans resize-none"
            placeholder="Type your custom system instructions..."
          />
        </div>
      )}

      {/* Main Floating Input Card (Mint Glow Card) */}
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-3xl bg-white border-2 transition-all p-2.5 sm:p-3 shadow-lg ${
          isDragging 
            ? 'border-emerald-500 bg-emerald-50/40 ring-4 ring-emerald-500/20' 
            : 'border-[#bfeade] mint-input-glow'
        }`}
      >
        {/* Attached Files Preview Bar */}
        {attachments.length > 0 && (
          <div className="flex items-center gap-2 pb-2.5 mb-2 border-b border-slate-100 overflow-x-auto flex-wrap animate-in fade-in">
            {attachments.map((att) => (
              <div 
                key={att.id}
                className="relative group flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-100/90 border border-slate-200 text-slate-800 text-xs shadow-2xs shrink-0"
              >
                {att.type === 'image' && att.dataUrl ? (
                  <div className="w-8 h-8 rounded-lg overflow-hidden border border-slate-300 shrink-0 bg-slate-900">
                    <img src={att.dataUrl} alt={att.name} className="w-full h-full object-cover" />
                  </div>
                ) : att.type === 'code' ? (
                  <FileCode className="w-4 h-4 text-blue-600 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-emerald-600 shrink-0" />
                )}

                <div className="flex flex-col min-w-0 max-w-[140px]">
                  <span className="font-semibold truncate text-[11px]">{att.name}</span>
                  <span className="text-[9px] text-slate-400 font-mono">{formatFileSize(att.size)}</span>
                </div>

                <button
                  type="button"
                  onClick={() => removeAttachment(att.id)}
                  className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                  title="Remove attachment"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-start gap-2">
          {/* Paperclip / Attach File Button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="p-2 rounded-full bg-slate-100 hover:bg-slate-200/80 text-slate-600 hover:text-slate-900 transition-colors shrink-0 mt-0.5 cursor-pointer group"
            title="Attach images, documents, or code files"
          >
            <Paperclip className="w-4 h-4 group-hover:rotate-45 transition-transform" />
          </button>

          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            rows={1}
            placeholder={
              isImageMode
                ? attachments.length > 0 
                  ? 'Describe changes or additions for this image...'
                  : 'Describe the image you want to generate or upload reference image (Enter to send)...'
                : attachments.length > 0
                  ? 'Ask anything about the attached file(s) or image(s)...'
                  : 'Ask anything, upload files/images, analyze code, or write essays (Enter to send)...'
            }
            className="w-full bg-transparent text-slate-900 placeholder-slate-400 py-1.5 focus:outline-none resize-none text-xs sm:text-sm leading-relaxed max-h-40 overflow-y-auto"
          />
        </div>

        {/* Bottom Toolbar inside input */}
        <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
          {/* Left tools: Model Selector pill & prompt button */}
          <div className="flex items-center gap-1.5 flex-wrap">
            <ModelSelector
              selectedModelId={selectedModel}
              onSelectModel={onSelectModel}
              compact
            />

            <button
              type="button"
              onClick={() => setShowSystemSettings(!showSystemSettings)}
              className={`p-1.5 rounded-full transition-colors cursor-pointer ${
                showSystemSettings || systemPrompt.trim()
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
              }`}
              title="Custom Instructions"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Right send / stop button */}
          <div>
            {isStreaming ? (
              <button
                type="button"
                onClick={onStop}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-red-500 hover:bg-red-600 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => handleSubmit()}
                disabled={!input.trim() && attachments.length === 0}
                className={`flex items-center gap-1.5 px-4 sm:px-5 py-2 rounded-full text-xs font-bold transition-all shadow-md cursor-pointer ${
                  input.trim() || attachments.length > 0
                    ? isImageMode 
                      ? 'bg-purple-600 hover:bg-purple-700 text-white shadow-purple-500/25 active:scale-95'
                      : 'bg-[#00d68f] hover:bg-[#00bf80] text-slate-950 shadow-emerald-500/25 active:scale-95'
                    : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                }`}
                title="Send"
              >
                {isImageMode ? (
                  <>
                    <span>{attachments.length > 0 ? 'Edit Image' : 'Generate'}</span>
                    <ImageIcon className="w-3.5 h-3.5 stroke-[2.2]" />
                  </>
                ) : (
                  <>
                    <span>Send</span>
                    <ArrowUp className="w-3.5 h-3.5 stroke-[2.5]" />
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
