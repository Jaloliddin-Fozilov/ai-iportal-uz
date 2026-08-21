'use client';

import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Bot, 
  Key, 
  BookOpen, 
  Code, 
  Zap, 
  Brain, 
  Sparkles, 
  ShieldCheck,
  User,
  LogIn,
  Gift,
  DollarSign,
  ShieldAlert
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { ModelSelector } from './ModelSelector';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { ApiKeysModal } from './ApiKeysModal';
import { DocsModal } from './DocsModal';
import { AuthModal } from './AuthModal';
import { 
  ChatSession, 
  getStoredSessions, 
  saveStoredSessions, 
  getActiveSessionId, 
  setActiveSessionId, 
  createNewSession, 
  getStoredPreferences, 
  saveStoredPreferences 
} from '@/lib/storage/clientChatStore';

export const ChatInterface: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeSessionId, setActiveSessionIdState] = useState<string | null>(null);
  
  // Active session state
  const [selectedModel, setSelectedModel] = useState('iportal-ai');
  const [systemPrompt, setSystemPrompt] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);

  // User auth state
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [authToken, setAuthToken] = useState<string>('');
  const [authModalOpen, setAuthModalOpen] = useState(false);

  // Modals state
  const [apiKeysModalOpen, setApiKeysModalOpen] = useState(false);
  const [docsModalOpen, setDocsModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load sessions and check user authentication
  useEffect(() => {
    const prefs = getStoredPreferences();
    setSelectedModel(prefs.defaultModel || 'iportal-ai');
    setSystemPrompt(prefs.systemPrompt);

    const stored = getStoredSessions();
    if (stored.length === 0) {
      const initial = createNewSession('iportal-ai', prefs.systemPrompt);
      setSessions([initial]);
      setActiveSessionIdState(initial.id);
    } else {
      setSessions(stored);
      const activeId = getActiveSessionId();
      const found = stored.find(s => s.id === activeId);
      if (found) {
        setActiveSessionIdState(found.id);
        setSelectedModel(found.model || 'iportal-ai');
        if (found.systemPrompt) setSystemPrompt(found.systemPrompt);
      } else {
        setActiveSessionIdState(stored[0].id);
        setSelectedModel(stored[0].model || 'iportal-ai');
      }
    }

    // Check user auth token
    const token = localStorage.getItem('iportal_auth_token') || '';
    if (token) {
      setAuthToken(token);
      fetch('/api/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => res.json())
        .then(data => {
          if (data.success && data.user) {
            setCurrentUser(data.user);
          } else {
            localStorage.removeItem('iportal_auth_token');
          }
        })
        .catch(() => {});
    }
  }, []);

  const activeSession = sessions.find(s => s.id === activeSessionId) || sessions[0];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [activeSession?.messages, isStreaming]);

  const handleSelectSession = (id: string) => {
    setActiveSessionIdState(id);
    setActiveSessionId(id);
    const target = sessions.find(s => s.id === id);
    if (target) {
      setSelectedModel(target.model || 'iportal-ai');
      if (target.systemPrompt) setSystemPrompt(target.systemPrompt);
    }
  };

  const handleNewChat = () => {
    const newSession = createNewSession(selectedModel, systemPrompt);
    setSessions([newSession, ...sessions]);
    setActiveSessionIdState(newSession.id);
  };

  const handleDeleteSession = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const filtered = sessions.filter(s => s.id !== id);
    if (filtered.length === 0) {
      const fresh = createNewSession(selectedModel, systemPrompt);
      setSessions([fresh]);
      setActiveSessionIdState(fresh.id);
    } else {
      setSessions(filtered);
      saveStoredSessions(filtered);
      if (activeSessionId === id) {
        setActiveSessionIdState(filtered[0].id);
        setActiveSessionId(filtered[0].id);
      }
    }
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModel(modelId);
    saveStoredPreferences({ defaultModel: modelId });
    if (activeSession) {
      activeSession.model = modelId;
      saveStoredSessions(sessions);
    }
  };

  const handleUpdateSystemPrompt = (prompt: string) => {
    setSystemPrompt(prompt);
    saveStoredPreferences({ systemPrompt: prompt });
    if (activeSession) {
      activeSession.systemPrompt = prompt;
      saveStoredSessions(sessions);
    }
  };

  const handleStopGeneration = () => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
    }
    setIsStreaming(false);
  };

  const handleAuthSuccess = (userData: any, token: string) => {
    setCurrentUser(userData);
    setAuthToken(token);
    localStorage.setItem('iportal_auth_token', token);
  };

  const handleLogout = () => {
    localStorage.removeItem('iportal_auth_token');
    setCurrentUser(null);
    setAuthToken('');
  };

  // Send Message with user token and streaming
  const handleSendMessage = async (userPrompt: string) => {
    if (!userPrompt.trim() || isStreaming || !activeSession) return;

    const userMessageId = `msg-user-${Date.now()}`;
    const assistantMessageId = `msg-assistant-${Date.now()}`;

    const userMsg = {
      id: userMessageId,
      role: 'user' as const,
      content: userPrompt,
      timestamp: Date.now(),
    };

    const initialAssistantMsg = {
      id: assistantMessageId,
      role: 'assistant' as const,
      content: '',
      timestamp: Date.now(),
      provider: undefined as string | undefined,
      node: undefined as string | undefined,
    };

    if (activeSession.messages.length === 0) {
      activeSession.title = userPrompt.slice(0, 30) + (userPrompt.length > 30 ? '...' : '');
    }

    activeSession.messages.push(userMsg, initialAssistantMsg);
    activeSession.updatedAt = Date.now();
    setSessions([...sessions]);
    saveStoredSessions(sessions);

    setIsStreaming(true);
    const controller = new AbortController();
    setAbortController(controller);

    try {
      const messagesPayload = [];
      if (systemPrompt.trim()) {
        messagesPayload.push({ role: 'system', content: systemPrompt.trim() });
      }

      for (const m of activeSession.messages) {
        if (m.id === assistantMessageId) continue;
        messagesPayload.push({ role: m.role, content: m.content });
      }

      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        'x-client': 'web-chat',
      };
      if (authToken) {
        headers['x-user-token'] = authToken;
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

      const usedProvider = response.headers.get('x-used-provider') || '';
      const usedNode = response.headers.get('x-used-node') || '';

      const targetAssistantMsg = activeSession.messages.find(m => m.id === assistantMessageId);
      if (targetAssistantMsg) {
        targetAssistantMsg.provider = usedProvider;
        targetAssistantMsg.node = usedNode;
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

            if (targetAssistantMsg) {
              targetAssistantMsg.content = accumulatedText;
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
          .then(d => { if (d.success) setCurrentUser(d.user); });
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        console.log('Stream to\'xtatildi');
      } else {
        const targetAssistantMsg = activeSession.messages.find(m => m.id === assistantMessageId);
        if (targetAssistantMsg) {
          targetAssistantMsg.content = `⚠️ Xatolik yuz berdi: ${err.message || 'Noma\'lum xatolik'}`;
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
      title: 'Python REST API tuzish',
      desc: 'FastAPI va SQLite bilan tezkor REST API loyihasini yaratib ber',
      model: 'iportal-ai-coder',
      icon: <Code className="w-4 h-4 text-emerald-400" />,
    },
    {
      title: 'Chuqur mantiqiy tahlil',
      desc: 'Kvant kompyuterlari va an\'anaviy kompyuterlar farqini tahlil qil',
      model: 'iportal-ai-reasoning',
      icon: <Brain className="w-4 h-4 text-purple-400" />,
    },
    {
      title: 'Ultra tezkor savol-javob',
      desc: 'O\'zbekiston IT ekotizimining eng so\'nggi yutuqlari nimalar?',
      model: 'iportal-ai-fast',
      icon: <Zap className="w-4 h-4 text-amber-400" />,
    },
    {
      title: 'Katta hujjat tahlili',
      desc: 'Biznes reja tuzishning asosiy 7 ta bosqichini batafsil yoritib ber',
      model: 'iportal-ai-pro',
      icon: <Sparkles className="w-4 h-4 text-blue-400" />,
    },
  ];

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#090b10] text-gray-100 font-sans">
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
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-[#090b10]">
        {/* Top Navbar */}
        <header className="h-14 border-b border-[#182030] bg-[#0c101a]/80 backdrop-blur-md px-3 md:px-6 flex items-center justify-between z-10 shrink-0">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="md:hidden p-2 text-gray-400 hover:text-white rounded-lg hover:bg-[#192236]"
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
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-400 text-xs font-mono font-bold hover:bg-emerald-900/40 transition-all cursor-pointer"
                title="Sizning balansingiz"
              >
                <DollarSign className="w-3.5 h-3.5" />
                <span>${currentUser.balance?.toFixed(2) ?? '5.00'}</span>
              </button>
            ) : (
              <button
                onClick={() => setAuthModalOpen(true)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-blue-600 hover:from-emerald-500 hover:to-blue-500 text-white text-xs font-semibold shadow-md transition-all cursor-pointer"
              >
                <Gift className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">$5 Bepul Balans</span>
                <span className="sm:hidden">Kirish</span>
              </button>
            )}

            {/* Admin Panel quick button if admin */}
            {currentUser?.role === 'admin' && (
              <Link
                href="/admin"
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-purple-950/40 border border-purple-500/40 text-purple-300 text-xs font-semibold hover:bg-purple-900/40 transition-colors"
                title="Admin Boshqaruv Markazi"
              >
                <ShieldAlert className="w-3.5 h-3.5 text-purple-400" />
                <span className="hidden md:inline">Admin</span>
              </Link>
            )}

            {/* API Keys quick button */}
            <button
              onClick={() => setApiKeysModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#141926] hover:bg-[#1c2436] border border-[#232d42] text-xs text-amber-300 hover:text-white transition-all cursor-pointer"
              title="API Kalitlar"
            >
              <Key className="w-3.5 h-3.5 text-amber-400" />
              <span className="hidden md:inline font-medium text-xs">API Key</span>
            </button>

            {/* Docs quick button */}
            <button
              onClick={() => setDocsModalOpen(true)}
              className="p-1.5 rounded-lg bg-[#141926] hover:bg-[#1c2436] border border-[#232d42] text-gray-400 hover:text-white transition-all cursor-pointer"
              title="Qo'llanma"
            >
              <BookOpen className="w-4 h-4 text-purple-400" />
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
                  provider={msg.provider}
                  node={msg.node}
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
            <div className="max-w-4xl mx-auto px-4 py-8 md:py-16 flex flex-col items-center justify-center text-center space-y-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-purple-600 flex items-center justify-center shadow-2xl shadow-blue-500/30 animate-pulse-glow">
                <Bot className="w-9 h-9 text-white" />
              </div>

              <div>
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-3">
                  <Gift className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Yangi foydalanuvchilar uchun $5.00 Bepul Balans beriladi</span>
                </div>
                <h1 className="text-2xl md:text-4xl font-extrabold text-white tracking-tight">
                  <span className="bg-gradient-to-r from-blue-400 via-indigo-300 to-purple-400 bg-clip-text text-transparent">
                    iportal-ai
                  </span>{' '}
                  bilan cheksiz intellekt
                </h1>
                <p className="text-xs md:text-sm text-gray-400 max-w-lg mx-auto mt-2 leading-relaxed">
                  Llama 3.3 70B, Gemini 2.0, DeepSeek R1 70B va zamonaviy bepul AI provayderlar klasteri.
                </p>
              </div>

              {/* Suggestion Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl mt-4 text-left">
                {promptSuggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      handleSelectModel(item.model);
                      handleSendMessage(item.desc);
                    }}
                    className="p-3.5 rounded-xl bg-[#111624] hover:bg-[#171f33] border border-[#1e293f] hover:border-blue-500/40 transition-all text-left group cursor-pointer"
                  >
                    <div className="flex items-center gap-2 mb-1.5">
                      {item.icon}
                      <span className="font-semibold text-xs text-white group-hover:text-blue-300 transition-colors">
                        {item.title}
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-400 line-clamp-2 leading-relaxed">
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
