import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { ApiKeyItem } from '../core/types';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  role: 'user' | 'admin';
  balance: number; // in USD ($5.00 default)
  totalSpent: number;
  totalRequests: number;
  createdAt: number;
  lastLoginAt?: number;
  status: 'active' | 'suspended';
  apiKeys: ApiKeyItem[];
}

export interface UsageTransaction {
  id: string;
  userId: string;
  apiKeyId?: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  costUsd: number;
  timestamp: number;
}

interface UserStoreData {
  users: UserAccount[];
  transactions: UsageTransaction[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const USERS_FILE = path.join(DATA_DIR, 'users.json');
const SECRET_KEY = process.env.JWT_SECRET || process.env.IPORTAL_MASTER_KEY || 'iportal-ai-auth-secret-salt-2026';

let inMemoryUserStore: UserStoreData | null = null;

export function hashPassword(password: string): string {
  return crypto.createHmac('sha256', SECRET_KEY).update(password).digest('hex');
}

export function generateSessionToken(user: UserAccount): string {
  const payload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    expiresAt: Date.now() + 30 * 24 * 60 * 60 * 1000, // 30 days
  };
  const jsonStr = JSON.stringify(payload);
  const base64Payload = Buffer.from(jsonStr).toString('base64url');
  const signature = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('base64url');
  return `${base64Payload}.${signature}`;
}

export function verifySessionToken(token: string): { valid: boolean; payload?: { userId: string; email: string; role: 'user' | 'admin' } } {
  try {
    if (!token || !token.includes('.')) return { valid: false };
    const [base64Payload, signature] = token.split('.');
    const expectedSig = crypto.createHmac('sha256', SECRET_KEY).update(base64Payload).digest('base64url');
    if (signature !== expectedSig) return { valid: false };

    const jsonStr = Buffer.from(base64Payload, 'base64url').toString('utf-8');
    const payload = JSON.parse(jsonStr);
    if (Date.now() > payload.expiresAt) return { valid: false };

    return { valid: true, payload };
  } catch {
    return { valid: false };
  }
}

function getInitialUserStore(): UserStoreData {
  const adminPassword = process.env.ADMIN_PASSWORD || '20020210FjX!';
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@iportal.uz';

  const defaultAdmin: UserAccount = {
    id: 'user-admin-root',
    name: 'Administrator',
    email: adminEmail,
    passwordHash: hashPassword(adminPassword),
    role: 'admin',
    balance: 999.00,
    totalSpent: 0,
    totalRequests: 0,
    createdAt: Date.now(),
    status: 'active',
    apiKeys: [
      {
        id: 'admin-master-key',
        key: process.env.IPORTAL_MASTER_KEY || 'ip-master-secret-key-change-me',
        name: 'Admin Master Key',
        createdAt: Date.now(),
        requestsCount: 0,
        status: 'active',
      }
    ],
  };

  return {
    users: [defaultAdmin],
    transactions: [],
  };
}

export function loadUserStore(): UserStoreData {
  if (inMemoryUserStore) return inMemoryUserStore;

  const initial = getInitialUserStore();

  try {
    if (fs.existsSync(USERS_FILE)) {
      const raw = fs.readFileSync(USERS_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.users)) {
        // Ensure admin exists
        const hasAdmin = parsed.users.some((u: UserAccount) => u.role === 'admin');
        if (!hasAdmin) {
          parsed.users.unshift(initial.users[0]);
        }
        inMemoryUserStore = {
          users: parsed.users,
          transactions: parsed.transactions || [],
        };
        return inMemoryUserStore;
      }
    }
  } catch (err) {
    console.warn('[UserStore] Error loading users file, using memory:', err);
  }

  inMemoryUserStore = initial;
  saveUserStore(inMemoryUserStore);
  return inMemoryUserStore;
}

export function saveUserStore(data: UserStoreData): void {
  inMemoryUserStore = data;
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(USERS_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    // console.warn('[UserStore] Failed disk write, stored in-memory');
  }
}

// User Actions
export function findUserByEmail(email: string): UserAccount | undefined {
  const store = loadUserStore();
  return store.users.find(u => u.email.toLowerCase() === email.toLowerCase().trim());
}

export function findUserById(id: string): UserAccount | undefined {
  const store = loadUserStore();
  return store.users.find(u => u.id === id);
}

export function findUserByApiKey(apiKey: string): { user?: UserAccount; keyItem?: ApiKeyItem } {
  const store = loadUserStore();
  for (const user of store.users) {
    if (user.status !== 'active') continue;
    const foundKey = user.apiKeys.find(k => k.key === apiKey && k.status === 'active');
    if (foundKey) {
      return { user, keyItem: foundKey };
    }
  }
  return {};
}

export function registerUser(name: string, email: string, password: string): UserAccount {
  const store = loadUserStore();
  const cleanEmail = email.toLowerCase().trim();

  if (findUserByEmail(cleanEmail)) {
    throw new Error('Ushbu email manziliga ega foydalanuvchi allaqachon mavjud.');
  }

  const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const initialKeySuffix = Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
  const defaultApiKey: ApiKeyItem = {
    id: `key-${Date.now()}`,
    key: `ip-live-${initialKeySuffix}`,
    name: 'Asosiy Bepul Kalit',
    createdAt: Date.now(),
    requestsCount: 0,
    status: 'active',
    rateLimitPerMin: 120,
  };

  const newUser: UserAccount = {
    id: userId,
    name: name.trim() || 'Foydalanuvchi',
    email: cleanEmail,
    passwordHash: hashPassword(password),
    role: 'user',
    balance: 5.00, // 🎁 $5.00 Welcome Free Credit
    totalSpent: 0,
    totalRequests: 0,
    createdAt: Date.now(),
    status: 'active',
    apiKeys: [defaultApiKey],
  };

  store.users.push(newUser);
  saveUserStore(store);
  return newUser;
}

export function deductUserBalance(
  userId: string,
  model: string,
  promptTokens: number,
  completionTokens: number,
  apiKeyId?: string
): { success: boolean; newBalance: number; cost: number } {
  const store = loadUserStore();
  const user = store.users.find(u => u.id === userId);
  if (!user) return { success: false, newBalance: 0, cost: 0 };

  // Free pricing calculation: $0.0001 per 1k input tokens, $0.0003 per 1k output tokens
  const cost = (promptTokens * 0.0001 + completionTokens * 0.0003) / 1000;
  const roundedCost = Math.max(0.00001, parseFloat(cost.toFixed(6)));

  user.balance = Math.max(0, parseFloat((user.balance - roundedCost).toFixed(6)));
  user.totalSpent = parseFloat((user.totalSpent + roundedCost).toFixed(6));
  user.totalRequests += 1;

  if (apiKeyId) {
    const keyItem = user.apiKeys.find(k => k.id === apiKeyId);
    if (keyItem) {
      keyItem.requestsCount += 1;
      keyItem.lastUsedAt = Date.now();
    }
  }

  // Record transaction
  store.transactions.push({
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    userId,
    apiKeyId,
    model,
    promptTokens,
    completionTokens,
    costUsd: roundedCost,
    timestamp: Date.now(),
  });

  saveUserStore(store);
  return { success: true, newBalance: user.balance, cost: roundedCost };
}
