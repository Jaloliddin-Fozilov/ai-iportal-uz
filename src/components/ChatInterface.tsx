'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Sparkles, 
  Brain, 
  Code, 
  Zap, 
  DollarSign, 
  Gift, 
  Key, 
  BookOpen, 
  ShieldAlert,
  ShieldCheck,
  Cpu
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { ModelSelector } from './ModelSelector';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { AuthModal } from './AuthModal';
import { ApiKeysModal } from './ApiKeysModal';
import { DocsModal } from './DocsModal';
import { 
  ChatSession, 
  getStoredSessions, 
  saveStoredSessions, 
  createNewSession 
} from '@/lib/storage/clientChatStore';

type ChatMessageItemData = ChatSession['messages'][0];

export const ChatInterface: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('iportal-ai');
  const [isStreaming, setIsStreaming] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState('');
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 1. Initial load from localStorage
  useEffect(() => {
    const loaded = getStoredSessions();
    setSessions(loaded);
    if (loaded.length > 0) {
      setActiveSessionId(loaded[0].id);
    } else {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      saveStoredSessions([fresh]);
    }

    const savedSysPrompt = localStorage.getItem('iportal_system_prompt') || '';
    setSystemPrompt(savedSysPrompt);

    const savedToken = localStorage.getItem('iportal_auth_token') || '';
    if (savedToken) {
      setAuthToken(savedToken);
      fetchUserData(savedToken);
    }
  }, []);

  const fetchUserData = async (token: string) => {
    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.user) {
        setCurrentUser(data.user);
      } else {
        localStorage.removeItem('iportal_auth_token');
        setAuthToken('');
        setCurrentUser(null);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleAuthSuccess = (token: string, user: any) => {
    setAuthToken(token);
    setCurrentUser(user);
    localStorage.setItem('iportal_auth_token', token);
  };

  const handleLogout = () => {
    localStorage.removeItem('iportal_auth_token');
    setAuthToken('');
    setCurrentUser(null);
  };

  // Scroll to bottom on message change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [sessions, activeSessionId, isStreaming]);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const handleNewChat = () => {
    const fresh = createNewSession();
    const updated = [fresh, ...sessions];
    setSessions(updated);
    setActiveSessionId(fresh.id);
    saveStoredSessions(updated);
  };

  const handleSelectSession = (id: string) => {
    setActiveSessionId(id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      const fresh = createNewSession();
      setSessions([fresh]);
      setActiveSessionId(fresh.id);
      saveStoredSessions([fresh]);
    } else {
      setSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionId(filtered[0].id);
      }
      saveStoredSessions(filtered);
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
  };

  const handleUpdateSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    localStorage.setItem('iportal_system_prompt', prompt);
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsStreaming(false);
    }
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isStreaming) return;

    if (!activeSession) return;

    // 1. Append User Message
    const userMsg: ChatMessageItemData = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text,
      timestamp: Date.now(),
    };

    const isFirstMessage = activeSession.messages.length === 0;
    if (isFirstMessage) {
      activeSession.title = text.slice(0, 32) + (text.length > 32 ? '...' : '');
    }

    activeSession.messages.push(userMsg);
    activeSession.updatedAt = Date.now();

    // 2. Prepare Assistant placeholder
    const assistantMessageId = `msg-${Date.now()}-a`;
    const assistantMsg: ChatMessageItemData = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    activeSession.messages.push(assistantMsg);

    setSessions([...sessions]);
    saveStoredSessions(sessions);

    setIsStreaming(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      // Build messages payload for OpenAI standard endpoint
      const messagesPayload: { role: string; content: string }[] = [];

      // User custom prompt if set in UI
      if (systemPrompt.trim()) {
        messagesPayload.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }

      // Add recent chat context (up to 12 messages)
      const contextMessages = activeSession.messages
        .filter(m => m.id !== assistantMessageId)
        .slice(-12)
        .map(m => ({
          role: m.role,
          content: m.content,
        }));

      messagesPayload.push(...contextMessages);

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
      };

      if (authToken) {
        headers['X-User-Token'] = authToken;
      }

      const response = await fetch('/api/v1/chat/completions', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          model: selectedModel,
          messages: messagesPayload,
          stream: true,
          temperature: 0.7,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP xatolik ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Javob oqimi (stream) mavjud emas');

      const decoder = new TextDecoder();
      let accumulatedText = '';
      let isThinking = false;
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue;

          if (trimmed === 'data: [DONE]') break;

          if (trimmed.startsWith('data: ')) {
            const dataStr = trimmed.slice(6);
            try {
              const parsed = JSON.parse(dataStr);
              const delta = parsed.choices?.[0]?.delta;
              if (delta) {
                const reasoning = delta.reasoning_content || delta.reasoning;
                const content = delta.content;

                if (reasoning) {
                  if (!isThinking) {
                    isThinking = true;
                    accumulatedText += '<think>' + reasoning;
                  } else {
                    accumulatedText += reasoning;
                  }
                } else if (content) {
                  if (isThinking) {
                    isThinking = false;
                    accumulatedText += '</think>\n\n' + content;
                  } else {
                    accumulatedText += content;
                  }
                }
              }
            } catch (e) {
              accumulatedText += dataStr;
            }

            const target = activeSession.messages.find(m => m.id === assistantMessageId);
            if (target) {
              target.content = accumulatedText;
              setSessions([...sessions]);
            }
          }
        }
      }

      saveStoredSessions(sessions);

      // Refresh balance after stream
      if (authToken) {
        fetch('/api/auth/me', { headers: { Authorization: `Bearer ${authToken}` } })
          .then(res => res.json())
          .then(data => {
            if (data.success && data.user) setCurrentUser(data.user);
          })
          .catch(() => {});
      }
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const target = activeSession.messages.find(m => m.id === assistantMessageId);
        if (target) {
          target.content = `⚠️ Xatolik yuz berdi: ${err.message}`;
          setSessions([...sessions]);
          saveStoredSessions(sessions);
        }
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  const promptSuggestions = [
    {
      title: 'Dasturlash va REST API',
      desc: 'FastAPI va SQLite bilan xavfsiz REST API loyihasini yaratib ber',
      model: 'iportal-ai-coder',
      icon: <Code className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Mantiqiy va Ilmiy Tahlil',
      desc: 'Kvant hisoblash va sun\'iy intellektning kelajakdagi integratsiyasi haqida tahlil',
      model: 'iportal-ai-reasoning',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Tezkor Savol-Javob',
      desc: 'O\'zbekiston IT ekotizimining eng so\'nggi yutuqlari va startap imkoniyatlari',
      model: 'iportal-ai-fast',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      title: 'Chuqur Tadqiqot va Biznes',
      desc: 'Zamonaviy SaaS loyihasi uchun biznes model va arxitektura rejasini tuzib ber',
      model: 'iportal-ai-pro',
      icon: <Sparkles className="w-4 h-4 text-cyan-400" />,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#06090e] text-slate-100 font-sans">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onNewChat={handleNewChat}
        onDeleteSession={handleDeleteSession}
        onOpenApiKeys={() => setApiKeysModalOpen(true)}
        onOpenDocs={() => setDocsModalOpen(true)}
        onOpenAuth={() => setAuthModalOpen(true)}
        currentUser={currentUser}
        onLogout={handleLogout}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#06090e]">
        {/* Top Navbar */}
        <header className="h-16 border-b border-[#141b2c] bg-[#080c14]/85 backdrop-blur-md px-3 md:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-slate-400 hover:text-white rounded-xl hover:bg-[#111726] transition-colors"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Model Selector */}
            <ModelSelector
              selectedModelId={selectedModel}
              onSelectModel={handleSelectModel}
            />
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* User Balance or Free $5 register banner */}
            {currentUser ? (
              <button
                onClick={() => setApiKeysModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-900/40 transition-all cursor-pointer shadow-sm"
                title="Sizning balansingiz"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>${currentUser.balance?.toFixed(2) ?? '5.00'}</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white text-xs font-semibold shadow-md shadow-blue-500/20 transition-all cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">$5.00 Bepul Balans</span>
                <span className="sm:hidden">Kirish</span>
              </button>
            )}

            {/* Admin Panel quick button if admin */}
            {currentUser?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-900/40 transition-colors"
                title="Admin Boshqaruv Markazi"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            {/* API Keys quick button */}
            <button
              onClick={() => setApiKeysModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[#0e1422] hover:bg-[#141c2c] border border-[#1b253b] text-xs text-amber-300 hover:text-white transition-all cursor-pointer"
              title="API Kalitlar"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-medium text-xs">API Key</span>
            </button>

            {/* Docs quick button */}
            <button
              onClick={() => setDocsModalOpen(true)}
              className="p-2 rounded-xl bg-[#0e1422] hover:bg-[#141c2c] border border-[#1b253b] text-slate-400 hover:text-white transition-all cursor-pointer"
              title="Qo'llanma"
            >
              <BookOpen className="w-4 h-4 text-cyan-400" />
            </button>
          </div>
        </header>

        {/* Chat Messages List / Welcome Screen */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden">
          {activeSession && activeSession.messages.length > 0 ? (
            <div className="pb-8">
              {activeSession.messages.map((msg, index) => (
                <ChatMessageItem
                  key={msg.id || index}
                  role={msg.role}
                  content={msg.content}
                  isStreaming={isStreaming && index === activeSession.messages.length - 1}
                  onRetry={() => {
                    const lastUser = activeSession.messages.slice(0, index).reverse().find(m => m.role === 'user');
                    if (lastUser) handleSendMessage(lastUser.content);
                  }}
                />
              ))}
              <div ref={messagesEndRef} />
            </div>
          ) : (
            /* Welcome Hero Screen */
            <div className="max-w-4xl mx-auto px-4 py-10 md:py-20 flex flex-col items-center justify-center text-center space-y-6">
              <div className="relative">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/25 border border-blue-400/30">
                  <Sparkles className="w-8 h-8 text-white" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="inline-flex items-center gap-2 px-3.5 py-1.2 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  <span>100% Xavfsiz, Qonuniy va Islomiy Axloq Qoidalariga Mos</span>
                </div>
                <h1 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-200 to-cyan-300 bg-clip-text text-transparent">
                    iportal-ai
                  </span>{' '}
                  Neyron Platformasi
                </h1>
                <p className="text-xs md:text-sm text-slate-400 max-w-lg mx-auto leading-relaxed">
                  Dasturlash, tahlil, ilm-fan va kundalik vazifalar uchun yuksak intellektli milliy yordamchi.
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full max-w-2xl mt-4 text-left">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSelectModel(item.model);
                      handleSendMessage(item.desc);
                    }}
                    className="p-4 rounded-2xl bg-[#0c101c] hover:bg-[#111728] border border-[#172138] hover:border-cyan-500/40 transition-all text-left group cursor-pointer shadow-lg shadow-black/30"
                  >
                    <div className="flex items-center gap-2.5 mb-1.5">
                      <div className="p-1.5 rounded-lg bg-[#141b2c] border border-[#1f2a42]">
                        {item.icon}
                      </div>
                      <span className="font-semibold text-xs text-white group-hover:text-cyan-300 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Input Field */}
        <ChatInput
          onSendMessage={handleSendMessage}
          onStop={handleStopGeneration}
          isStreaming={isStreaming}
          systemPrompt={systemPrompt}
          onUpdateSystemPrompt={handleUpdateSystemPrompt}
        />
      </div>

      {/* Modals */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      <ApiKeysModal
        isOpen={apiKeysModalOpen}
        onClose={() => setApiKeysModalOpen(false)}
        currentUser={currentUser}
        onOpenAuth={() => setAuthModalOpen(true)}
      />

      <DocsModal
        isOpen={docsModalOpen}
        onClose={() => setDocsModalOpen(false)}
      />
    </div>
  );
};
