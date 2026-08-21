'use client';

import React from 'react';
import { 
  Plus, 
  MessageSquare, 
  Key, 
  BookOpen, 
  Trash2, 
  X, 
  Bot,
  User,
  LogIn,
  LogOut,
  Gift,
  ShieldAlert
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
}) => {
  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 w-72 bg-[#0c101c] border-r border-[#1a2336] flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header / Brand */}
        <div className="p-4 border-b border-[#1a2336] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-bold text-sm text-white tracking-wide">iportal-ai</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 font-mono px-1.5 py-0.2 rounded border border-blue-500/30">
                  FREE
                </span>
              </div>
              <p className="text-[11px] text-gray-400">ai.iportal.uz</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 text-gray-400 hover:text-white rounded-lg hover:bg-[#1a2233]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Free $5 Call to Action Banner if not logged in */}
        {!currentUser && (
          <div className="p-3">
            <button
              onClick={() => {
                onOpenAuth();
                if (window.innerWidth < 768) onClose();
              }}
              className="w-full p-2.5 rounded-xl bg-gradient-to-r from-emerald-950/60 to-blue-950/60 border border-emerald-500/30 text-left transition-all hover:border-emerald-400/50 cursor-pointer"
            >
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-300">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span>$5 Bepul Balans Oling!</span>
              </div>
              <p className="text-[10px] text-gray-300 mt-0.5">Ro'yxatdan o'ting va API kalitga ega bo'ling</p>
            </button>
          </div>
        )}

        {/* New Chat Button */}
        <div className="px-3 py-2">
          <button
            onClick={() => {
              onNewChat();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-medium text-xs shadow-md shadow-blue-500/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Yangi Suhbat</span>
          </button>
        </div>

        {/* Chat History List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-1">
          <div className="px-2 py-1 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
            Suhbatlar Tarixi
          </div>
          {sessions.length === 0 ? (
            <div className="p-4 text-center text-xs text-gray-500">
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
                  className={`group flex items-center justify-between p-2 rounded-xl text-xs transition-all cursor-pointer ${
                    isActive
                      ? 'bg-[#182033] text-white border border-[#273550] shadow-sm font-medium'
                      : 'text-gray-400 hover:bg-[#121828] hover:text-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-2.5 truncate">
                    <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-blue-400' : 'text-gray-500'}`} />
                    <span className="truncate">{s.title || 'Yangi Suhbat'}</span>
                  </div>
                  <button
                    onClick={(e) => onDeleteSession(s.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-red-400 transition-opacity rounded"
                    title="O'chirish"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Bottom Navigation & User Profile */}
        <div className="p-3 border-t border-[#1a2336] space-y-1.5 bg-[#090d17]">
          {/* API Keys Button */}
          <button
            onClick={() => {
              onOpenApiKeys();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#141c2c] hover:text-white transition-colors cursor-pointer"
          >
            <Key className="w-4 h-4 text-amber-400" />
            <span>API Kalitlar & Balans</span>
          </button>

          {/* Admin link (if admin) */}
          {currentUser?.role === 'admin' && (
            <Link
              href="/admin"
              className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-purple-300 hover:bg-[#141c2c] hover:text-white transition-colors"
            >
              <ShieldAlert className="w-4 h-4 text-purple-400" />
              <span>Admin Boshqaruv Paneli</span>
            </Link>
          )}

          {/* Documentation */}
          <button
            onClick={() => {
              onOpenDocs();
              if (window.innerWidth < 768) onClose();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-gray-300 hover:bg-[#141c2c] hover:text-white transition-colors cursor-pointer"
          >
            <BookOpen className="w-4 h-4 text-purple-400" />
            <span>Qo'llanma & Integratsiya</span>
          </button>

          {/* User Account / Login pill */}
          <div className="pt-2 border-t border-[#1a2336]">
            {currentUser ? (
              <div className="flex items-center justify-between p-2 rounded-xl bg-[#121726] border border-[#1e293f]">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="w-7 h-7 rounded-full bg-blue-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
                    {currentUser.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-bold text-white truncate">{currentUser.name}</div>
                    <div className="text-[11px] text-emerald-400 font-mono font-semibold">
                      ${currentUser.balance?.toFixed(2) ?? '5.00'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={onLogout}
                  className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg hover:bg-[#1a2233] transition-colors"
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
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-[#182136] hover:bg-[#222d48] text-blue-300 text-xs font-semibold border border-[#2b3a58] transition-colors cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Kirish / Ro'yxatdan o'tish</span>
              </button>
            )}
          </div>
        </div>
      </aside>
    </>
  );
};
