'use client';

import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Key, 
  BookOpen, 
  Trash2, 
  X, 
  Code, 
  Brain, 
  Zap, 
  Sparkles, 
  LogIn, 
  LogOut, 
  Gift, 
  ShieldAlert,
  ChevronRight
} from 'lucide-react';
import Link from 'next/link';
import { ChatSession } from '@/lib/storage/clientChatStore';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: ChatSession[];
  activeSessionId: string | null;
  onSelectSession: (id: string) => void;
  onNewChat: () => void;
  onDeleteSession: (id: string, e: React.MouseEvent) => void;
  onOpenApiKeys: () => void;
  onOpenDocs: () => void;
  onOpenAuth: () => void;
  currentUser?: any;
  onLogout: () => void;
  onSelectModelPreset?: (modelId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  isOpen,
  onClose,
  sessions,
  activeSessionId,
  onSelectSession,
  onNewChat,
  onDeleteSession,
  onOpenApiKeys,
  onOpenDocs,
  onOpenAuth,
  currentUser,
  onLogout,
  onSelectModelPreset,
}) => {
  const modelPresets = [
    { id: 'iportal-ai-coder', label: 'Dasturlash (Code)', icon: <Code className="w-4 h-4 text-emerald-600" /> },
    { id: 'iportal-ai-reasoning', label: 'Mantiq (Reasoning)', icon: <Brain className="w-4 h-4 text-purple-600" /> },
    { id: 'iportal-ai-fast', label: 'Tezkor Savol (Turbo)', icon: <Zap className="w-4 h-4 text-amber-600" /> },
    { id: 'iportal-ai-pro', label: 'Tahlil & Hujjat (Pro)', icon: <Sparkles className="w-4 h-4 text-blue-600" /> },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 md:hidden transition-opacity"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-64 md:w-72 bg-[#f6f9f8] border-r border-[#e3ede8] flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand in mobile */}
        <div className="h-16 px-4 border-b border-[#e3ede8] flex items-center justify-between md:hidden">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#00d68f] to-[#059669] flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
              <Sparkles className="w-4 h-4" />
            </div>
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">iportal-ai</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* New Chat Button (Prominent pill card like in reference) */}
        <div className="p-3.5">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-800 font-bold text-xs shadow-sm border border-slate-200/80 transition-all hover:shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Quick Menu / Capabilities */}
        <div className="px-3.5 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Menu
          </div>
          {modelPresets.map(preset => (
            <button
              key={preset.id}
              onClick={() => {
                if (onSelectModelPreset) onSelectModelPreset(preset.id);
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left cursor-pointer"
            >
              {preset.icon}
              <span className="truncate">{preset.label}</span>
            </button>
          ))}
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-3.5 pt-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
            Suhbatlar Tarixi
          </div>
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              Hozircha suhbatlar yo'q
            </div>
          ) : (
            sessions.map((s) => {
              const isActive = s.id === activeSessionId;
              return (
                <div
                  key={s.id}
                  onClick={() => {
                    onSelectSession(s.id);
                    if (window.innerWidth < 768) onClose();
                  }}
                  className={`group flex items-center justify-between p-2.5 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-white text-slate-900 border border-emerald-300/80 shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-white/80 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-emerald-600' : 'text-slate-400'}`} />
                    <span className="truncate">{s.title || 'Yangi Suhbat'}</span>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity rounded"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Profile / Actions */}
        <div className="p-3 border-t border-[#e3ede8] space-y-1.5 bg-[#f0f6f4]">
          {/* Quick API & Docs */}
          <div className="grid grid-cols-2 gap-1.5 pb-1">
            <button
              onClick={() => {
                onOpenApiKeys();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 text-[11px] font-semibold border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <Key className="w-3.5 h-3.5 text-amber-500" />
              <span>API Key</span>
            </button>
            <button
              onClick={() => {
                onOpenDocs();
                if (window.innerWidth < 768) onClose();
              }}
              className="flex items-center justify-center gap-1.5 py-1.5 px-2 rounded-xl bg-white text-slate-700 hover:text-slate-900 text-[11px] font-semibold border border-slate-200 shadow-2xs transition-all cursor-pointer"
            >
              <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
              <span>Qo'llanma</span>
            </button>
          </div>

          {/* Admin link if admin */}
          {currentUser?.role === 'admin' && (
            <Link
              href="/admin"
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50 hover:bg-purple-100/80 border border-purple-200/80 text-xs font-semibold text-purple-700 transition-colors"
            >
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                <span>Boshqaruv Paneli</span>
              </div>
              <ChevronRight className="w-3.5 h-3.5 text-purple-400" />
            </Link>
          )}

          {/* User Account Card */}
          {currentUser ? (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-slate-800 to-slate-700 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                  <div className="text-[11px] text-emerald-600 font-mono font-bold">
                    ${currentUser.balance?.toFixed(2) ?? '5.00'}
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                title="Chiqish"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => {
                onOpenAuth();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-gradient-to-r from-[#00d68f] to-[#059669] hover:from-[#00c483] hover:to-[#04825b] text-white text-xs font-bold shadow-md shadow-emerald-500/20 transition-all cursor-pointer"
            >
              <Gift className="w-3.5 h-3.5" />
              <span>Kirish & $5.00 Balans</span>
            </button>
          )}
        </div>
      </aside>
    </>
  );
};
