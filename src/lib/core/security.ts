/**
 * ai.iportal.uz — Xavfsizlik va Rate Limiter Moduli
 * 
 * Tizimni DDoS, so'rovlar spami va ruxsatsiz suiiste'mol qilishdan himoyalaydi.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const ipRateLimits = new Map<string, RateLimitRecord>();
const keyRateLimits = new Map<string, RateLimitRecord>();

// Cleanup stale records every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, record] of ipRateLimits.entries()) {
    if (now > record.resetAt) ipRateLimits.delete(key);
  }
  for (const [key, record] of keyRateLimits.entries()) {
    if (now > record.resetAt) keyRateLimits.delete(key);
  }
}, 5 * 60 * 1000);

export class SecurityGuard {
  /**
   * Ruxsat berilgan rasmiy AI API domenlari (SSRF hujumlaridan himoya)
   */
  static readonly ALLOWED_AI_HOSTS = [
    'api.groq.com',
    'generativelanguage.googleapis.com',
    'api.sambanova.ai',
    'api.cerebras.ai',
    'openrouter.ai',
    'api.mistral.ai',
    'api.cloudflare.com',
    'router.huggingface.co',
    'api-inference.huggingface.co',
  ];

  /**
   * Nishon URL manzilining xavfsizligini tekshirish (Faqat rasmiy AI provayderlarga ruxsat)
   */
  static isAllowedTargetUrl(targetUrl: string): boolean {
    try {
      const parsed = new URL(targetUrl);
      if (parsed.protocol !== 'https:') return false;
      return this.ALLOWED_AI_HOSTS.some(host => parsed.hostname === host || parsed.hostname.endsWith(`.${host}`));
    } catch {
      return false;
    }
  }

  /**
   * IP bo'yicha Rate Limiting (DDoS va spamdan himoya)
   * Standart: 1 daqiqada 60 ta so'rov
   */
  static checkIpRateLimit(ip: string, limitPerMin = 60): { allowed: boolean; remaining: number; resetInSec: number } {
    const now = Date.now();
    const windowMs = 60 * 1000;
    
    let record = ipRateLimits.get(ip);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      ipRateLimits.set(ip, record);
      return { allowed: true, remaining: limitPerMin - 1, resetInSec: 60 };
    }

    if (record.count >= limitPerMin) {
      const resetInSec = Math.ceil((record.resetAt - now) / 1000);
      return { allowed: false, remaining: 0, resetInSec };
    }

    record.count += 1;
    return {
      allowed: true,
      remaining: limitPerMin - record.count,
      resetInSec: Math.ceil((record.resetAt - now) / 1000),
    };
  }

  /**
   * API Kalit bo'yicha Rate Limiting
   */
  static checkKeyRateLimit(apiKey: string, limitPerMin = 120): { allowed: boolean; remaining: number } {
    const now = Date.now();
    const windowMs = 60 * 1000;

    let record = keyRateLimits.get(apiKey);
    if (!record || now > record.resetAt) {
      record = { count: 1, resetAt: now + windowMs };
      keyRateLimits.set(apiKey, record);
      return { allowed: true, remaining: limitPerMin - 1 };
    }

    if (record.count >= limitPerMin) {
      return { allowed: false, remaining: 0 };
    }

    record.count += 1;
    return { allowed: true, remaining: limitPerMin - record.count };
  }

  /**
   * Xabarlar mazmunini sanitarizatsiya qilish va tekshirish
   */
  static sanitizeInput(text: string, maxChars = 32000): string {
    if (!text || typeof text !== 'string') return '';
    return text.slice(0, maxChars);
  }
}
