'use client';

import React, { useState } from 'react';
import { 
  Plus, 
  MessageSquare, 
  Key, 
  BookOpen, 
  Trash2, 
  X, 
  Search,
  Image as ImageIcon,
  Library,
  LogOut, 
  ShieldAlert,
  ChevronRight,
  Sparkles,
  User,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { ChatSession } from '@/lib/storage/clientChatStore';
import { AIOrb } from './AIOrb';

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
  onOpenImageMode: () => void;
  onOpenLibraryModal: () => void;
  currentUser?: any;
  onLogout: () => void;
  selectedModel?: string;
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
  onOpenImageMode,
  onOpenLibraryModal,
  currentUser,
  onLogout,
  selectedModel,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchInput, setShowSearchInput] = useState(false);
  const [showDevMenu, setShowDevMenu] = useState(false);

  const isImageActive = selectedModel === 'iportal-image' || selectedModel === 'image-flux';

  // Filter sessions by search query
  const filteredSessions = searchQuery.trim()
    ? sessions.filter(s => {
        const titleMatch = (s.title || '').toLowerCase().includes(searchQuery.toLowerCase());
        const msgMatch = s.messages.some(m => (m.content || '').toLowerCase().includes(searchQuery.toLowerCase()));
        return titleMatch || msgMatch;
      })
    : sessions;

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
            <AIOrb size="sm" />
            <span className="font-extrabold text-sm text-slate-900 tracking-tight">iportal-ai</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. [New Chat] Button */}
        <div className="p-3.5 pb-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-white hover:bg-slate-50 text-slate-900 font-bold text-xs shadow-sm border border-slate-200/80 transition-all hover:shadow-md active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-emerald-600 stroke-[2.5]" />
            <span>New Chat</span>
          </button>
        </div>

        {/* 2. Menu Items: [Search], [Image Studio], [Library] */}
        <div className="px-3.5 space-y-1">
          {/* [Search chats] */}
          <div>
            <button
              onClick={() => setShowSearchInput(!showSearchInput)}
              className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer ${
                showSearchInput ? 'bg-white text-slate-900 shadow-xs border border-slate-200' : 'text-slate-700 hover:bg-white hover:shadow-xs'
              }`}
            >
              <Search className="w-4 h-4 text-slate-500" />
              <span>Search chats</span>
            </button>

            {showSearchInput && (
              <div className="p-1 pt-1.5 animate-in fade-in">
                <input
                  type="text"
                  autoFocus
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Filter chats by keyword..."
                  className="w-full px-3 py-1.5 rounded-xl bg-white border border-emerald-300 text-xs text-slate-900 placeholder-slate-400 focus:outline-none shadow-xs"
                />
              </div>
            )}
          </div>

          {/* [Image Studio] */}
          <button
            onClick={() => {
              onOpenImageMode();
              if (window.innerWidth < 768) onClose();
            }}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left cursor-pointer group ${
              isImageActive 
                ? 'bg-white text-slate-900 border border-purple-300 shadow-xs font-bold' 
                : 'text-slate-700 hover:bg-white hover:shadow-xs'
            }`}
          >
            <ImageIcon className="w-4 h-4 text-purple-600 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between w-full">
              <span>Image Studio</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-purple-100 text-purple-700 font-bold">Vision</span>
            </div>
          </button>

          {/* [Library / Gallery] */}
          <button
            onClick={() => {
              onOpenLibraryModal();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left cursor-pointer group"
          >
            <Library className="w-4 h-4 text-emerald-600 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between w-full">
              <span>Library & Gallery</span>
              <span className="text-[10px] text-slate-400 font-mono">30d</span>
            </div>
          </button>

          {/* [API & Docs Portal] */}
          <Link
            href="/docs"
            onClick={() => {
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-white hover:shadow-xs transition-all text-left cursor-pointer group"
          >
            <BookOpen className="w-4 h-4 text-cyan-600 group-hover:scale-110 transition-transform" />
            <div className="flex items-center justify-between w-full">
              <span>API & Docs</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-cyan-100 text-cyan-800 font-bold">Portal</span>
            </div>
          </Link>
        </div>

        {/* 3. Chat History List */}
        <div className="flex-1 overflow-y-auto px-3.5 pt-3 space-y-1">
          <div className="px-2 py-1 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Recent Chats</span>
            {searchQuery && <span className="text-[10px] font-normal text-emerald-600">{filteredSessions.length} found</span>}
          </div>
          {filteredSessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-slate-400">
              {searchQuery ? 'No matching chats' : 'No previous conversations'}
            </div>
          ) : (
            filteredSessions.map((s) => {
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
                    <span className="truncate">{s.title || 'New Conversation'}</span>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-red-500 transition-opacity rounded"
                    title="Delete chat"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* 4. Bottom User Card & Clean Settings */}
        <div className="p-3 border-t border-[#e3ede8] space-y-1.5 bg-[#f0f6f4]">
          {/* Settings Drawer / Accordion */}
          {showDevMenu && (
            <div className="p-2 bg-white rounded-2xl border border-slate-200 space-y-1 shadow-md mb-2 animate-in fade-in">
              <button
                onClick={() => {
                  onOpenApiKeys();
                  setShowDevMenu(false);
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>Developer API Keys</span>
              </button>
              <button
                onClick={() => {
                  onOpenDocs();
                  setShowDevMenu(false);
                  if (window.innerWidth < 768) onClose();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors text-left"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                <span>API Documentation</span>
              </button>
              {currentUser?.role === 'admin' && (
                <Link
                  href="/admin"
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-purple-700 hover:bg-purple-50 transition-colors"
                >
                  <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                  <span>Admin Dashboard</span>
                </Link>
              )}
            </div>
          )}

          {/* User Account Card */}
          {currentUser ? (
            <div className="flex items-center justify-between p-2.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs">
              <div 
                onClick={() => setShowDevMenu(!showDevMenu)}
                className="flex items-center gap-2.5 min-w-0 cursor-pointer flex-1"
              >
                <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-white text-xs font-bold shrink-0">
                  {currentUser.name?.[0]?.toUpperCase() || 'U'}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold text-slate-900 truncate">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <span>Settings & API</span>
                    <ChevronRight className="w-3 h-3 text-slate-400" />
                  </div>
                </div>
              </div>
              <button
                onClick={onLogout}
                className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-slate-100 transition-colors"
                title="Log out"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  onOpenAuth();
                  if (window.innerWidth < 768) onClose();
                }}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md transition-all cursor-pointer"
              >
                <User className="w-4 h-4" />
                <span>Sign In</span>
              </button>
              <button
                onClick={() => setShowDevMenu(!showDevMenu)}
                className="p-2.5 rounded-2xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
                title="Developer Settings & Docs"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </aside>
    </>
  );
};
