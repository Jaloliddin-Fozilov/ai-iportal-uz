'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Sparkles, 
  Brain, 
  Code, 
  Zap, 
  Key, 
  BookOpen, 
  ShieldAlert,
  Compass,
  Terminal,
  Cpu,
  Layers,
  Activity,
  Globe,
  Sliders,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
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

  // Top nav active tab
  const [activeNavTab, setActiveNavTab] = useState<'chat' | 'docs' | 'keys'>('chat');

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
      const messagesPayload: { role: string; content: string }[] = [];

      if (systemPrompt.trim()) {
        messagesPayload.push({
          role: 'system',
          content: systemPrompt.trim(),
        });
      }

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

  const quickCategories = [
    {
      title: 'Dasturlash & Kod',
      prompt: 'FastAPI va SQLite bilan xavfsiz REST API loyihasini yaratib ber',
      model: 'iportal-ai-coder',
      icon: <Code className="w-3.5 h-3.5 text-emerald-600" />,
    },
    {
      title: 'Biznes & Tahlil',
      prompt: 'Yangi startap loyihasi uchun biznes reja va moliyaviy model tuzib ber',
      model: 'iportal-ai-pro',
      icon: <Compass className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      title: 'Chuqur Mantiq',
      prompt: 'Kvant hisoblash va sun\'iy intellekt integratsiyasini bosqichma-bosqich tahlil qil',
      model: 'iportal-ai-reasoning',
      icon: <Brain className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      title: 'Tezkor Savol',
      prompt: 'O\'zbekiston IT ekotizimining eng so\'nggi yutuqlari nimalar?',
      model: 'iportal-ai-fast',
      icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
    },
    {
      title: 'Matn & Maqola',
      prompt: 'Zamonaviy texnologiyalar haqida professional ilmiy maqola yozib ber',
      model: 'iportal-ai',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  const officialBots = [
    { name: 'Flagship 120B', type: 'Flagship Core', icon: <Cpu className="w-4 h-4 text-emerald-600" /> },
    { name: 'Coder 120B', type: 'Software Master', icon: <Code className="w-4 h-4 text-blue-600" /> },
    { name: 'Logic 27B', type: 'Deep Reasoning', icon: <Brain className="w-4 h-4 text-purple-600" /> },
    { name: 'Turbo 20B', type: 'High Speed', icon: <Zap className="w-4 h-4 text-amber-600" /> },
    { name: 'Research Pro', type: 'Deep Knowledge', icon: <Sparkles className="w-4 h-4 text-cyan-600" /> },
    { name: 'Edge Mesh', type: 'Global Routing', icon: <Globe className="w-4 h-4 text-slate-700" /> },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#edf3f0] text-slate-900 font-sans p-2 sm:p-3 md:p-4">
      {/* Outer Rounded Application Frame (Sorin Style) */}
      <div className="flex-1 flex overflow-hidden rounded-3xl bg-white border border-[#dce8e2] shadow-2xl shadow-emerald-900/5">
        {/* Left Sidebar */}
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
          selectedModel={selectedModel}
          onSelectModelPreset={(m) => {
            handleSelectModel(m);
          }}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
          {/* Top Navbar matching Sorin layout */}
          <header className="h-16 border-b border-[#edf3f0] px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 bg-white/90 backdrop-blur-md">
            {/* Left: Brand Logo & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full bg-[#00d68f] flex items-center justify-center text-slate-950 shadow-md shadow-emerald-500/20">
                  <Globe className="w-5 h-5 text-slate-950 stroke-[2.2]" />
                </div>
                <div className="hidden sm:block">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">
                    iportal-ai
                  </span>
                </div>
              </div>
            </div>

            {/* Center Segmented Navigation Pills */}
            <div className="hidden md:flex items-center gap-1 p-1 bg-[#f3f7f5] rounded-full border border-[#e2ece6]">
              <button
                onClick={() => setActiveNavTab('chat')}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                  activeNavTab === 'chat'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                AI Chatbot
              </button>
              <button
                onClick={() => { setActiveNavTab('docs'); setDocsModalOpen(true); }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                Qo'llanma
              </button>
              <button
                onClick={() => { setActiveNavTab('keys'); setApiKeysModalOpen(true); }}
                className="px-4 py-1.5 rounded-full text-xs font-semibold text-slate-600 hover:text-slate-900 transition-all cursor-pointer"
              >
                API & Balans
              </button>
            </div>

            {/* Right Controls: Balance + User Avatar */}
            <div className="flex items-center gap-2">
              {/* Balance pill */}
              <button
                onClick={() => setApiKeysModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#f3f7f5] hover:bg-[#e7f0ec] text-slate-800 text-xs font-bold transition-colors cursor-pointer border border-[#e2ece6]"
              >
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>${currentUser?.balance?.toFixed(2) ?? '5.00'}</span>
              </button>

              {/* User Avatar */}
              {currentUser ? (
                <div 
                  onClick={() => setApiKeysModalOpen(true)}
                  className="flex items-center gap-2 pl-2 cursor-pointer"
                >
                  <div className="w-8 h-8 rounded-full bg-slate-800 text-white flex items-center justify-center text-xs font-bold shadow-xs">
                    {currentUser.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-xs font-semibold text-slate-700 hidden lg:inline truncate max-w-[100px]">
                    {currentUser.name}
                  </span>
                </div>
              ) : (
                <button
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-sm transition-all cursor-pointer"
                >
                  <span>Kirish</span>
                </button>
              )}
            </div>
          </header>

          {/* Main Messages List / Sorin Hero Screen */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden relative flex flex-col justify-between">
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
              /* Sorin-style Hero Screen */
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 max-w-4xl mx-auto w-full text-center space-y-6">
                {/* Central Glowing Mint Orb */}
                <div className="relative my-2">
                  <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-[#00d68f] via-[#059669] to-[#10b981] flex items-center justify-center text-white shadow-2xl animate-orb-glow">
                    <Globe className="w-10 h-10 text-white stroke-[2]" />
                  </div>
                </div>

                {/* Headline: "Hey, I'm iportal. How can I help you today?" */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Hey, I'm{' '}
                    <span className="text-[#00d68f]">
                      iportal
                    </span>
                    . How can I help you today?
                  </h1>
                </div>

                {/* Category Suggestion Pills */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-2xl">
                  {quickCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSelectModel(cat.model);
                        handleSendMessage(cat.prompt);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95"
                    >
                      {cat.icon}
                      <span>{cat.title}</span>
                    </button>
                  ))}
                </div>

                {/* Chat Input Floating Card placed in center on empty state */}
                <div className="w-full pt-4">
                  <ChatInput
                    onSendMessage={handleSendMessage}
                    onStop={handleStopGeneration}
                    isStreaming={isStreaming}
                    systemPrompt={systemPrompt}
                    onUpdateSystemPrompt={handleUpdateSystemPrompt}
                    selectedModel={selectedModel}
                    onSelectModel={handleSelectModel}
                  />
                </div>

                {/* Bottom Official Bots / Clusters Icons Row (Matching reference image) */}
                <div className="pt-6 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Official Bots & Neural Cluster
                  </div>
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 flex-wrap">
                    {officialBots.map((bot, idx) => (
                      <div
                        key={idx}
                        className="group relative p-2.5 rounded-2xl bg-white hover:bg-emerald-50/60 border border-slate-200/90 hover:border-emerald-300 shadow-2xs hover:shadow-sm transition-all cursor-pointer"
                        title={`${bot.name} — ${bot.type}`}
                      >
                        {bot.icon}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* If messages exist, keep input at the bottom */}
            {activeSession && activeSession.messages.length > 0 && (
              <ChatInput
                onSendMessage={handleSendMessage}
                onStop={handleStopGeneration}
                isStreaming={isStreaming}
                systemPrompt={systemPrompt}
                onUpdateSystemPrompt={handleUpdateSystemPrompt}
                selectedModel={selectedModel}
                onSelectModel={handleSelectModel}
              />
            )}
          </div>
        </div>
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
