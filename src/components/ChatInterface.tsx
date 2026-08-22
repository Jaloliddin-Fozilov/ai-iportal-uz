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
  DollarSign,
  Image as ImageIcon,
  Library,
  RotateCw,
  Check
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { AuthModal } from './AuthModal';
import { ApiKeysModal } from './ApiKeysModal';
import { DocsModal } from './DocsModal';
import { ImageModal } from './ImageModal';
import { LibraryModal } from './LibraryModal';
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

  // Prompt rotation index
  const [promptRotation, setPromptRotation] = useState(0);

  // Modals
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [libraryModalOpen, setLibraryModalOpen] = useState(false);

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>('');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initial load from localStorage
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

    // Set a random initial rotation
    setPromptRotation(Math.floor(Math.random() * 4));
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

  // Rotating prompts pool
  const promptPools = {
    code: [
      'FastAPI va SQLite bilan xavfsiz REST API loyihasini yaratib ber',
      'React 19 Server Components va Custom Hook optimizatsiyasi bo\'yicha amaliy kod yoz',
      'Python da asinxron ma\'lumotlar tahlili va web scraping skripti tayyorla',
      'Docker va Nginx bilan Next.js full-stack ilovani production serverga joylash',
    ],
    biz: [
      'Yangi startap loyihasi uchun biznes reja va moliyaviy model tuzib ber',
      'O\'zbekiston bozorida e-tijorat loyihasi uchun marketing va SEO strategiyasi tuz',
      'SaaS mahsuloti uchun narxlash modellari va retention (saqlab qolish) strategiyasini tahlil qil',
      'Investorlar uchun 10 ta slayddan iborat ta\'sirchan Pitch Deck rejasini yoz',
    ],
    logic: [
      'Kvant hisoblash va sun\'iy intellekt integratsiyasini bosqichma-bosqich tahlil qil',
      'Murakkab matematik optimallashtirish masalasini First Principles orqali yech',
      'Sun\'iy ong va transformator neyron tarmoqlarining ishlash mantig\'ini chuqur tushuntir',
      'Kriptografiya va blokcheyn konsensus algoritmlarini solishtirib ber',
    ],
    fast: [
      'O\'zbekiston IT ekotizimining eng so\'nggi yutuqlari nimalar?',
      'Dasturchi uchun kunlik eng foydali 5 ta mahsuldorlik qoidasi qaysi?',
      'TypeScript da Generic turlar qanday ishlaydi, qisqa misol keltir',
      'PostgreSQL va Redis o\'rtasidagi asosiy farqlar nimada?',
    ],
    writing: [
      'Zamonaviy texnologiyalar haqida professional ilmiy maqola yozib ber',
      'Telegram kanal uchun qiziqarli va jalb qiluvchi texnologik post matni tayyorla',
      'Yangi mobil ilova uchun App Store va Play Market tavsif matnini yoz',
      'Kompaniya brendi uchun kuchli va ishonchli About Us matnini tuz',
    ],
  };

  const quickCategories = [
    {
      title: 'Dasturlash & Kod',
      prompt: promptPools.code[promptRotation % promptPools.code.length],
      model: 'iportal-ai-coder',
      icon: <Code className="w-3.5 h-3.5 text-emerald-600" />,
    },
    {
      title: 'Biznes & Tahlil',
      prompt: promptPools.biz[promptRotation % promptPools.biz.length],
      model: 'iportal-ai-pro',
      icon: <Compass className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      title: 'Chuqur Mantiq',
      prompt: promptPools.logic[promptRotation % promptPools.logic.length],
      model: 'iportal-ai-reasoning',
      icon: <Brain className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      title: 'Tezkor Savol',
      prompt: promptPools.fast[promptRotation % promptPools.fast.length],
      model: 'iportal-ai-fast',
      icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
    },
    {
      title: 'Matn & Maqola',
      prompt: promptPools.writing[promptRotation % promptPools.writing.length],
      model: 'iportal-ai',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  // Interactive Official Bots & Neural Cluster
  const officialBots = [
    { id: 'iportal-ai', name: 'Flagship 120B', type: 'Flagship Core', model: 'iportal-ai', icon: <Cpu className="w-4 h-4 text-emerald-600" /> },
    { id: 'iportal-ai-coder', name: 'Coder 120B', type: 'Software Master', model: 'iportal-ai-coder', icon: <Code className="w-4 h-4 text-blue-600" /> },
    { id: 'iportal-ai-reasoning', name: 'Logic 27B', type: 'Deep Reasoning', model: 'iportal-ai-reasoning', icon: <Brain className="w-4 h-4 text-purple-600" /> },
    { id: 'iportal-ai-fast', name: 'Turbo 20B', type: 'High Speed', model: 'iportal-ai-fast', icon: <Zap className="w-4 h-4 text-amber-600" /> },
    { id: 'iportal-ai-pro', name: 'Research Pro', type: 'Deep Knowledge', model: 'iportal-ai-pro', icon: <Sparkles className="w-4 h-4 text-cyan-600" /> },
    { id: 'flux-image', name: 'Flux Studio', type: 'Image Generator', isImage: true, icon: <ImageIcon className="w-4 h-4 text-purple-600" /> },
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
          onOpenImageModal={() => setImageModalOpen(true)}
          onOpenLibraryModal={() => setLibraryModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          selectedModel={selectedModel}
          onSelectModelPreset={(m) => handleSelectModel(m)}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
          {/* Top Navbar */}
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

            {/* Center: Clean Single Tab [AI Chatbot] */}
            <div className="hidden md:flex items-center">
              <div className="px-4 py-1.5 rounded-full bg-[#f3f7f5] text-slate-900 text-xs font-bold border border-[#e2ece6] shadow-xs flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-[#00d68f] animate-pulse" />
                <span>AI Chatbot</span>
              </div>
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

                {/* Rotating Category Suggestion Pills with Re-roll button */}
                <div className="flex flex-wrap items-center justify-center gap-2 pt-2 max-w-2xl">
                  {quickCategories.map((cat, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        handleSelectModel(cat.model);
                        handleSendMessage(cat.prompt);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 border border-slate-200 text-xs font-semibold shadow-2xs hover:shadow-xs transition-all cursor-pointer active:scale-95 group"
                    >
                      {cat.icon}
                      <span>{cat.title}</span>
                    </button>
                  ))}

                  {/* Re-roll button */}
                  <button
                    onClick={() => setPromptRotation(prev => prev + 1)}
                    className="p-1.5 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-all cursor-pointer"
                    title="Yangi promtlarni ko'rsatish"
                  >
                    <RotateCw className="w-3.5 h-3.5" />
                  </button>
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

                {/* Interactive Official Bots & Neural Cluster Row */}
                <div className="pt-6 space-y-3">
                  <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    Official Bots & Neural Cluster
                  </div>
                  <div className="flex items-center justify-center gap-2.5 sm:gap-3.5 flex-wrap">
                    {officialBots.map((bot) => {
                      const isBotActive = selectedModel === bot.model;
                      return (
                        <button
                          key={bot.id}
                          type="button"
                          onClick={() => {
                            if (bot.isImage) {
                              setImageModalOpen(true);
                            } else if (bot.model) {
                              handleSelectModel(bot.model);
                            }
                          }}
                          className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center ${
                            isBotActive
                              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs hover:shadow-sm'
                          }`}
                          title={`${bot.name} — ${bot.type} (Faollashtirish)`}
                        >
                          {bot.icon}
                        </button>
                      );
                    })}
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

      <ImageModal
        isOpen={imageModalOpen}
        onClose={() => setImageModalOpen(false)}
      />

      <LibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onSelectPrompt={(p, m) => {
          if (m) handleSelectModel(m);
          handleSendMessage(p);
        }}
      />
    </div>
  );
};
