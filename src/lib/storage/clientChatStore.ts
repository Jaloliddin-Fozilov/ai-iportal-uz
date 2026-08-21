import { ChatMessage } from '../core/types';

export interface ChatSession {
  id: string;
  title: string;
  model: string;
  systemPrompt?: string;
  messages: (ChatMessage & { id: string; timestamp: number; provider?: string; node?: string })[];
  createdAt: number;
  updatedAt: number;
}

const SESSIONS_KEY = 'iportal_ai_sessions_v1';
const ACTIVE_SESSION_KEY = 'iportal_ai_active_session_v1';
const PREFS_KEY = 'iportal_ai_prefs_v1';

export interface UserPreferences {
  customApiKey?: string;
  defaultModel: string;
  systemPrompt: string;
  temperature: number;
}

export const DEFAULT_PREFS: UserPreferences = {
  defaultModel: 'iportal-ai',
  systemPrompt: 'Siz iportal-ai — iportal.uz tomonidan yaratilgan aqlli, xushmuomala, har qanday savolga aniq va to\'liq javob beruvchi sun\'iy intellektsiz.',
  temperature: 0.7,
};

export function getStoredPreferences(): UserPreferences {
  if (typeof window === 'undefined') return DEFAULT_PREFS;
  try {
    const raw = localStorage.getItem(PREFS_KEY);
    if (raw) return { ...DEFAULT_PREFS, ...JSON.parse(raw) };
  } catch (e) {
    // Ignore error
  }
  return DEFAULT_PREFS;
}

export function saveStoredPreferences(prefs: Partial<UserPreferences>): void {
  if (typeof window === 'undefined') return;
  const current = getStoredPreferences();
  const updated = { ...current, ...prefs };
  localStorage.setItem(PREFS_KEY, JSON.stringify(updated));
}

export function getStoredSessions(): ChatSession[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SESSIONS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) {
    console.error('Error loading sessions from storage', e);
  }
  return [];
}

export function saveStoredSessions(sessions: ChatSession[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(sessions));
  } catch (e) {
    console.error('Error saving sessions to storage', e);
  }
}

export function getActiveSessionId(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ACTIVE_SESSION_KEY);
}

export function setActiveSessionId(id: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ACTIVE_SESSION_KEY, id);
}

export function createNewSession(model = 'iportal-ai', systemPrompt?: string): ChatSession {
  const newSession: ChatSession = {
    id: `chat-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    title: 'Yangi Suhbat',
    model,
    systemPrompt: systemPrompt || DEFAULT_PREFS.systemPrompt,
    messages: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  const sessions = getStoredSessions();
  sessions.unshift(newSession);
  saveStoredSessions(sessions);
  setActiveSessionId(newSession.id);

  return newSession;
}
