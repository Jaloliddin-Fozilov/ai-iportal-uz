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
  Cpu,
  Globe,
  Image as ImageIcon,
  RotateCw,
  User,
  Settings
} from 'lucide-react';
import Link from 'next/link';
import { Sidebar } from './Sidebar';
import { ChatMessageItem } from './ChatMessageItem';
import { ChatInput } from './ChatInput';
import { AuthModal } from './AuthModal';
import { ApiKeysModal } from './ApiKeysModal';
import { DocsModal } from './DocsModal';
import { LibraryModal } from './LibraryModal';
import { AIOrb } from './AIOrb';
import { 
  ChatSession, 
  getStoredSessions, 
  saveStoredSessions, 
  createNewSession 
} from '@/lib/storage/clientChatStore';
import { ChatAttachment } from '@/lib/core/types';
import { addImageToGallery } from '@/lib/storage/clientGalleryStore';

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

  const handleStartImageMode = () => {
    setSelectedModel('iportal-image');
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

  const handleSendMessage = async (text: string, attachments?: ChatAttachment[]) => {
    if ((!text.trim() && (!attachments || attachments.length === 0)) || isStreaming) return;
    if (!activeSession) return;

    // 1. Append User Message with Attachments
    const userMsg: ChatMessageItemData = {
      id: `msg-${Date.now()}-u`,
      role: 'user',
      content: text,
      attachments: attachments && attachments.length > 0 ? attachments : undefined,
      timestamp: Date.now(),
    };

    const isFirstMessage = activeSession.messages.length === 0;
    if (isFirstMessage) {
      const titleCandidate = text.trim() || (attachments?.[0]?.name ? `File: ${attachments[0].name}` : 'New Conversation');
      activeSession.title = titleCandidate.slice(0, 32) + (titleCandidate.length > 32 ? '...' : '');
    }

    activeSession.messages.push(userMsg);
    activeSession.updatedAt = Date.now();

    // 2. Prepare Assistant placeholder
    const assistantMessageId = `msg-${Date.now()}-a`;
    const trimmedText = text.trim();
    const isImageGeneration = 
      selectedModel === 'iportal-image' || 
      selectedModel === 'image-flux' ||
      trimmedText.toLowerCase().startsWith('/image') ||
      trimmedText.toLowerCase().startsWith('generate image ') ||
      trimmedText.toLowerCase().startsWith('create image ') ||
      trimmedText.toLowerCase().startsWith('rasm chiz ') ||
      trimmedText.toLowerCase().startsWith('rasm yarat ') ||
      (attachments && attachments.some(a => a.type === 'image') && (trimmedText.toLowerCase().includes('edit') || trimmedText.toLowerCase().includes('o\'zgartir') || trimmedText.toLowerCase().includes('generate') || trimmedText.toLowerCase().includes('chiz')));

    const cleanImagePrompt = trimmedText
      .replace(/^\/image\s*/i, '')
      .replace(/^generate image\s*/i, '')
      .replace(/^create image\s*/i, '')
      .replace(/^rasm chiz\s*/i, '')
      .replace(/^rasm yarat\s*/i, '')
      .trim();

    const assistantMsg: ChatMessageItemData = {
      id: assistantMessageId,
      role: 'assistant',
      content: isImageGeneration ? '🎨 Generating high-resolution image with iportal Neural Engine...' : '',
      timestamp: Date.now(),
    };
    activeSession.messages.push(assistantMsg);

    setSessions([...sessions]);
    saveStoredSessions(sessions);
    setIsStreaming(true);

    // If Image Generation mode is active, call image API directly in chat!
    if (isImageGeneration) {
      try {
        const contextMessages = activeSession.messages
          .filter(m => m.id !== assistantMessageId)
          .slice(-8)
          .map(m => ({
            role: m.role,
            content: m.content,
          }));

        const imgRes = await fetch('/api/v1/images/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt: cleanImagePrompt || trimmedText || 'Generate image inspired by attached reference',
            messages: contextMessages,
            width: 1024,
            height: 1024,
          }),
        });

        const imgData = await imgRes.json();
        if (imgData.success && imgData.imageUrl) {
          const finalPromptUsed = imgData.prompt || cleanImagePrompt || trimmedText;
          // Save to user's 30-day gallery automatically
          addImageToGallery(finalPromptUsed, imgData.imageUrl, 'iportal Image', '1:1');

          const target = activeSession.messages.find(m => m.id === assistantMessageId);
          if (target) {
            const editNotice = imgData.wasModifiedFromContext ? '\n*✨ Iterated with context from previous scene*' : '';
            target.content = `![${finalPromptUsed}](${imgData.imageUrl})\n\n**Prompt:** *${finalPromptUsed}*${editNotice}\n**Engine:** iportal Neural Image • Saved to Library (30 days)`;
            setSessions([...sessions]);
            saveStoredSessions(sessions);
          }
        } else {
          throw new Error(imgData.error || 'Failed to generate image');
        }
      } catch (err: any) {
        const target = activeSession.messages.find(m => m.id === assistantMessageId);
        if (target) {
          target.content = `⚠️ Image generation error: ${err.message}`;
          setSessions([...sessions]);
          saveStoredSessions(sessions);
        }
      } finally {
        setIsStreaming(false);
      }
      return;
    }

    // Standard Text / Reasoning Completion Stream
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
        .map(m => {
          let fullContent = m.content || '';
          if (m.attachments && m.attachments.length > 0) {
            const attachedDocs = m.attachments
              .filter(a => a.content)
              .map(a => `\n\n--- [Attached Document: ${a.name}] ---\n${a.content}\n--- [End of ${a.name}] ---`)
              .join('\n');

            const attachedImages = m.attachments
              .filter(a => a.type === 'image')
              .map(a => `\n[Attached Image: ${a.name}]`)
              .join('');

            fullContent = `${fullContent}${attachedDocs}${attachedImages}`.trim();
          }
          return {
            role: m.role,
            content: fullContent,
          };
        });

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
        throw new Error(errJson.error?.message || `HTTP Error ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Response stream not available');

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
    } catch (err: any) {
      if (err.name !== 'AbortError') {
        const target = activeSession.messages.find(m => m.id === assistantMessageId);
        if (target) {
          const rawMsg = err.message || '';
          if (
            rawMsg.includes('TOO_LONG') || 
            rawMsg.includes('Request too large') || 
            rawMsg.includes('413') || 
            rawMsg.includes('tokens per minute') ||
            rawMsg.includes('xotira') ||
            rawMsg.includes('uzun')
          ) {
            target.content = `⚠️ error:too_long`;
          } else if (rawMsg.includes('RATE_LIMIT') || rawMsg.includes('429') || rawMsg.includes('limit')) {
            target.content = `⚠️ error:rate_limit`;
          } else if (rawMsg.includes('FILE') || rawMsg.includes('pdf') || rawMsg.includes('hujjat')) {
            target.content = `⚠️ error:file_error`;
          } else {
            target.content = `⚠️ error:high_load`;
          }
          setSessions([...sessions]);
          saveStoredSessions(sessions);
        }
      }
    } finally {
      setIsStreaming(false);
      setAbortController(null);
    }
  };

  // Rotating prompts pool in English
  const promptPools = {
    code: [
      'Build a complete REST API with FastAPI, JWT auth, and PostgreSQL database models',
      'Explain how React 19 Server Components work with practical code examples',
      'Write a high-performance Python script for asynchronous web scraping and data parsing',
      'Deploy a Next.js full-stack application using Docker, Nginx, and SSL configuration',
    ],
    biz: [
      'Draft an executive summary and financial projection model for a B2B SaaS startup',
      'Conduct a competitive SWOT analysis and go-to-market strategy for an AI platform',
      'Create a high-conversion 10-slide investor pitch deck structure with slide scripts',
      'Design a customer retention and viral referral flywheel for a mobile application',
    ],
    logic: [
      'Analyze the convergence of quantum computing and transformer neural architectures',
      'Solve a complex mathematical optimization problem step-by-step using First Principles',
      'Explain the mathematical foundation of gradient descent and backpropagation in deep learning',
      'Compare Byzantine Fault Tolerance with Proof-of-Stake consensus mechanisms',
    ],
    fast: [
      'What are the 5 most critical design patterns every senior software engineer should master?',
      'How does TypeScript generic variance (covariance vs contravariance) work with examples?',
      'Explain the difference between Redis in-memory caching and Memcached',
      'Give me a concise summary of the latest breakthroughs in open-weight LLMs',
    ],
    writing: [
      'Write an engaging, SEO-optimized technology article on the future of autonomous AI agents',
      'Craft a compelling launch announcement post for Product Hunt and Twitter/X',
      'Write a professional, trustworthy About Us page for a modern tech venture',
      'Generate 5 viral newsletter hooks and outlines on software productivity hacks',
    ],
  };

  const quickCategories = [
    {
      title: 'Coding & Dev',
      prompt: promptPools.code[promptRotation % promptPools.code.length],
      model: 'iportal-ai-coder',
      icon: <Code className="w-3.5 h-3.5 text-emerald-600" />,
    },
    {
      title: 'Business & Strategy',
      prompt: promptPools.biz[promptRotation % promptPools.biz.length],
      model: 'iportal-ai-pro',
      icon: <Compass className="w-3.5 h-3.5 text-blue-600" />,
    },
    {
      title: 'Deep Reasoning',
      prompt: promptPools.logic[promptRotation % promptPools.logic.length],
      model: 'iportal-ai-reasoning',
      icon: <Brain className="w-3.5 h-3.5 text-purple-600" />,
    },
    {
      title: 'Quick Answers',
      prompt: promptPools.fast[promptRotation % promptPools.fast.length],
      model: 'iportal-ai-fast',
      icon: <Zap className="w-3.5 h-3.5 text-amber-600" />,
    },
    {
      title: 'Content & Writing',
      prompt: promptPools.writing[promptRotation % promptPools.writing.length],
      model: 'iportal-ai',
      icon: <Sparkles className="w-3.5 h-3.5 text-emerald-500" />,
    },
  ];

  // Interactive Official Bots & Neural Cluster
  const officialBots = [
    { id: 'iportal-ai', name: 'iportal Flagship', type: 'Flagship Core', model: 'iportal-ai', icon: <Cpu className="w-4 h-4 text-emerald-600" /> },
    { id: 'iportal-ai-coder', name: 'iportal Code', type: 'Code Master', model: 'iportal-ai-coder', icon: <Code className="w-4 h-4 text-blue-600" /> },
    { id: 'iportal-ai-reasoning', name: 'iportal Logic', type: 'Deep Reasoning', model: 'iportal-ai-reasoning', icon: <Brain className="w-4 h-4 text-purple-600" /> },
    { id: 'iportal-ai-fast', name: 'iportal Turbo', type: 'High Speed', model: 'iportal-ai-fast', icon: <Zap className="w-4 h-4 text-amber-600" /> },
    { id: 'iportal-ai-pro', name: 'iportal Pro', type: 'Deep Research', model: 'iportal-ai-pro', icon: <Sparkles className="w-4 h-4 text-cyan-600" /> },
    { id: 'iportal-image', name: 'iportal Image', type: 'Image Studio', model: 'iportal-image', icon: <ImageIcon className="w-4 h-4 text-purple-600" /> },
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
          onOpenImageMode={handleStartImageMode}
          onOpenLibraryModal={() => setLibraryModalOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          selectedModel={selectedModel}
        />

        {/* Main Canvas Area */}
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden bg-white">
          {/* Top Navbar */}
          <header className="h-16 border-b border-[#edf3f0] px-4 sm:px-6 flex items-center justify-between z-10 shrink-0 bg-white/90 backdrop-blur-md">
            {/* Left: Brand Logo & Mobile Toggle */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <Menu className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-2.5">
                <AIOrb size="sm" />
                <div className="hidden sm:block">
                  <span className="font-extrabold text-base text-slate-900 tracking-tight">
                    iportal-ai
                  </span>
                </div>
              </div>
            </div>

            {/* Right Controls: Clean Profile & Settings */}
            <div className="flex items-center gap-2">
              <Link
                href="/docs"
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f3f7f5] hover:bg-[#e7f0ec] text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-[#e2ece6]"
              >
                <BookOpen className="w-3.5 h-3.5 text-cyan-600" />
                <span>API Docs</span>
              </Link>

              <button
                onClick={() => setApiKeysModalOpen(true)}
                className="hidden sm:flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#f3f7f5] hover:bg-[#e7f0ec] text-slate-700 text-xs font-bold transition-colors cursor-pointer border border-[#e2ece6]"
              >
                <Key className="w-3.5 h-3.5 text-amber-500" />
                <span>API Keys</span>
              </button>

              {currentUser ? (
                <div 
                  onClick={() => setApiKeysModalOpen(true)}
                  className="flex items-center gap-2 pl-1 cursor-pointer"
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
                  <User className="w-3.5 h-3.5" />
                  <span>Sign In</span>
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
                    attachments={msg.attachments}
                    isStreaming={isStreaming && index === activeSession.messages.length - 1}
                    onRetry={(withoutAttachments = false) => {
                      const lastUser = activeSession.messages.slice(0, index).reverse().find(m => m.role === 'user');
                      if (lastUser) {
                        handleSendMessage(lastUser.content, withoutAttachments ? undefined : lastUser.attachments);
                      }
                    }}
                    onNewChat={handleNewChat}
                  />
                ))}
                <div ref={messagesEndRef} />
              </div>
            ) : (
              /* Hero Screen */
              <div className="flex-1 flex flex-col items-center justify-center px-4 py-8 md:py-12 max-w-4xl mx-auto w-full text-center space-y-6">
                {/* 3D Holographic AI Wave Orb */}
                <div className="relative my-3">
                  <AIOrb size="lg" />
                </div>

                {/* Headline */}
                <div className="space-y-2">
                  <h1 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-slate-900 tracking-tight">
                    Hey, I'm{' '}
                    <span className="text-[#00d68f]">
                      iportal
                    </span>
                    . How can I help you today?
                  </h1>
                </div>

                {/* Dynamic Category Suggestion Pills with Re-roll button */}
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
                    title="Shuffle prompt ideas"
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
                          onClick={() => handleSelectModel(bot.model)}
                          className={`group relative p-2.5 rounded-2xl border transition-all cursor-pointer flex items-center justify-center ${
                            isBotActive
                              ? 'bg-emerald-50 border-emerald-400 ring-2 ring-emerald-400/40 shadow-sm'
                              : 'bg-white hover:bg-slate-50 border-slate-200/90 shadow-2xs hover:shadow-sm'
                          }`}
                          title={`${bot.name} — ${bot.type} (Activate)`}
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

      <LibraryModal
        isOpen={libraryModalOpen}
        onClose={() => setLibraryModalOpen(false)}
        onStartImageChat={handleStartImageMode}
      />
    </div>
  );
};
