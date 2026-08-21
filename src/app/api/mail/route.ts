import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifySessionToken, findUserById } from '@/lib/storage/userStore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const MAIL_BASE_DIR = '/var/www/iportal_uz_usr/data/email/iportal.uz';
const ACCOUNTS = ['ai1', 'ai2', 'ai3', 'ai4', 'ai5', 'gmail', 'otp', 'tech', 'mail'];
const MAIL_PASSWORDS = ['20020210FjX!'];

function checkMailAuth(req: NextRequest): boolean {
  const authHeader = req.headers.get('authorization') || '';
  const token = authHeader.replace(/^Bearer\s+/i, '').trim();

  if (!token) return false;

  if (MAIL_PASSWORDS.includes(token) || token === process.env.ADMIN_PASSWORD) {
    return true;
  }

  if (token === process.env.IPORTAL_MASTER_KEY || token === 'ip-master-secret-key-change-me') {
    return true;
  }

  const { valid, payload } = verifySessionToken(token);
  if (valid && payload) {
    const user = findUserById(payload.userId);
    if (user && user.role === 'admin') return true;
  }

  return false;
}

export interface ParsedEmail {
  id: string;
  account: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  timestamp: number;
  htmlBody: string;
  textBody: string;
  body: string;
  preview: string;
  isHtml: boolean;
  actionLinks: { text: string; url: string }[];
  otpCode: string | null;
  rawFile: string;
}

function decodeQuotedPrintable(str: string): string {
  return str
    .replace(/=\r?\n/g, '') // remove soft line breaks
    .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => {
      try {
        return String.fromCharCode(parseInt(hex, 16));
      } catch {
        return '';
      }
    });
}

function decodeMimeHeader(headerStr: string): string {
  if (!headerStr) return '';
  return headerStr.replace(/=\?([^?]+)\?([BQbq])\?([^?]+)\?=/g, (_, charset, encoding, text) => {
    try {
      if (encoding.toUpperCase() === 'B') {
        return Buffer.from(text, 'base64').toString(charset.toLowerCase() === 'utf-8' ? 'utf-8' : 'latin1');
      } else if (encoding.toUpperCase() === 'Q') {
        return decodeQuotedPrintable(text.replace(/_/g, ' '));
      }
    } catch {
      // fallback
    }
    return text;
  });
}

function extractUrlsFromText(text: string): string[] {
  const urlRegex = /https?:\/\/[^\s<>"')]+[^\s<>"').,:;]/gi;
  const matches = text.match(urlRegex) || [];
  return Array.from(new Set(matches));
}

function extractActionLinks(html: string, text: string): { text: string; url: string }[] {
  const links: { text: string; url: string }[] = [];
  const seenUrls = new Set<string>();

  // Extract from <a> tags in HTML
  const aTagRegex = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = aTagRegex.exec(html)) !== null) {
    const rawUrl = decodeQuotedPrintable(match[1].trim());
    const label = match[2].replace(/<[^>]*>/g, '').trim();
    if (rawUrl && !seenUrls.has(rawUrl)) {
      seenUrls.add(rawUrl);
      links.push({
        text: label || 'Havola',
        url: rawUrl,
      });
    }
  }

  // Extract plain URLs if not many links found
  if (links.length === 0) {
    const rawUrls = extractUrlsFromText(text);
    for (const u of rawUrls) {
      const cleanUrl = decodeQuotedPrintable(u);
      if (!seenUrls.has(cleanUrl)) {
        seenUrls.add(cleanUrl);
        links.push({
          text: 'Tasdiqlash / Kirish Havolasi',
          url: cleanUrl,
        });
      }
    }
  }

  // Filter out image/tracking URLs
  return links.filter(l => 
    !l.url.includes('open?upn=') && 
    !l.url.endsWith('.png') && 
    !l.url.endsWith('.gif') && 
    !l.url.endsWith('.jpg')
  );
}

function extractOtpCode(subject: string, text: string): string | null {
  const fullContent = `${subject}\n${text}`;
  
  // Look for explicit patterns like: "code: 123456", "kod: 849201", "OTP: 4066", "verification code is 582910"
  const explicitMatch = fullContent.match(/(?:code|kod|otp|verification|tasdiqlash|pin)[\s:=is]*([0-9]{4,8})/i);
  if (explicitMatch && explicitMatch[1]) {
    return explicitMatch[1];
  }

  // Look for standalone 4-8 digit numbers that are not standard years (e.g. not 2024, 2025, 2026)
  const allDigits = fullContent.match(/\b\d{4,8}\b/g) || [];
  for (const d of allDigits) {
    if (d !== '2024' && d !== '2025' && d !== '2026' && d !== '1000' && d !== '1001') {
      return d;
    }
  }

  return null;
}

function parseEmailFile(account: string, filePath: string): ParsedEmail | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const headerBodySplit = raw.indexOf('\n\n') !== -1 ? raw.indexOf('\n\n') : raw.indexOf('\r\n\r\n');
    
    let headersRaw = '';
    let bodyRaw = '';

    if (headerBodySplit !== -1) {
      headersRaw = raw.substring(0, headerBodySplit);
      bodyRaw = raw.substring(headerBodySplit).trim();
    } else {
      headersRaw = raw;
      bodyRaw = '';
    }

    let from = 'Noma\'lum';
    let to = `${account}@iportal.uz`;
    let subject = '(Mavzu yo\'q)';
    let date = new Date().toLocaleString();
    let timestamp = fs.statSync(filePath).mtimeMs;
    let contentTypeHeader = '';

    const lines = headersRaw.split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];
      if (/^From:/i.test(line)) from = decodeMimeHeader(line.replace(/^From:\s*/i, '').trim());
      if (/^To:/i.test(line)) to = decodeMimeHeader(line.replace(/^To:\s*/i, '').trim());
      if (/^Subject:/i.test(line)) subject = decodeMimeHeader(line.replace(/^Subject:\s*/i, '').trim());
      if (/^Date:/i.test(line)) {
        date = line.replace(/^Date:\s*/i, '').trim();
        const parsed = Date.parse(date);
        if (!isNaN(parsed)) timestamp = parsed;
      }
      if (/^Content-Type:/i.test(line)) {
        contentTypeHeader = line.replace(/^Content-Type:\s*/i, '').trim();
        // Capture multiline content-type headers
        while (i + 1 < lines.length && /^\s+/.test(lines[i + 1])) {
          contentTypeHeader += ' ' + lines[i + 1].trim();
          i++;
        }
      }
    }

    let htmlBody = '';
    let textBody = '';

    // Check if multipart
    const boundaryMatch = contentTypeHeader.match(/boundary=["']?([^"';\s]+)["']?/i) || bodyRaw.match(/--([a-zA-Z0-9'()+_,-./:=?]+)/);
    
    if (boundaryMatch && boundaryMatch[1]) {
      const boundary = boundaryMatch[1].replace(/^--/, '');
      const parts = bodyRaw.split(new RegExp(`--${boundary}(?:--)?`));

      for (const part of parts) {
        const trimmed = part.trim();
        if (!trimmed) continue;

        const partSplit = trimmed.indexOf('\n\n') !== -1 ? trimmed.indexOf('\n\n') : trimmed.indexOf('\r\n\r\n');
        let partHeaders = '';
        let partContent = '';

        if (partSplit !== -1) {
          partHeaders = trimmed.substring(0, partSplit);
          partContent = trimmed.substring(partSplit).trim();
        } else {
          partContent = trimmed;
        }

        const isPartHtml = /text\/html/i.test(partHeaders);
        const isPartQuotedPrintable = /quoted-printable/i.test(partHeaders);
        const isPartBase64 = /base64/i.test(partHeaders);

        let decodedPart = partContent;
        if (isPartQuotedPrintable) {
          decodedPart = decodeQuotedPrintable(partContent);
        } else if (isPartBase64) {
          try {
            decodedPart = Buffer.from(partContent.replace(/\s+/g, ''), 'base64').toString('utf-8');
          } catch {
            decodedPart = partContent;
          }
        }

        if (isPartHtml) {
          htmlBody = decodedPart;
        } else if (/text\/plain/i.test(partHeaders) || (!htmlBody && !textBody)) {
          textBody = decodedPart;
        }
      }
    } else {
      // Single part
      const isQuoted = /quoted-printable/i.test(headersRaw);
      const isBase64 = /base64/i.test(headersRaw);
      let decoded = bodyRaw;

      if (isQuoted) decoded = decodeQuotedPrintable(bodyRaw);
      else if (isBase64) {
        try {
          decoded = Buffer.from(bodyRaw.replace(/\s+/g, ''), 'base64').toString('utf-8');
        } catch {
          decoded = bodyRaw;
        }
      }

      if (/text\/html/i.test(contentTypeHeader)) {
        htmlBody = decoded;
      } else {
        textBody = decoded;
      }
    }

    // Clean up textBody and generate preview
    const cleanText = (textBody || htmlBody.replace(/<[^>]*>/g, ' '))
      .replace(/\s+/g, ' ')
      .trim();

    const preview = cleanText.slice(0, 160) || '(Xabar matni bo\'sh)';
    const actionLinks = extractActionLinks(htmlBody, textBody || cleanText);
    const otpCode = extractOtpCode(subject, cleanText);

    return {
      id: path.basename(filePath),
      account,
      from,
      to,
      subject,
      date,
      timestamp,
      htmlBody,
      textBody: textBody || cleanText,
      body: htmlBody || textBody || cleanText,
      preview,
      isHtml: !!htmlBody,
      actionLinks,
      otpCode,
      rawFile: filePath,
    };
  } catch (err) {
    console.error('Error parsing email file:', filePath, err);
    return null;
  }
}

export async function GET(req: NextRequest) {
  if (!checkMailAuth(req)) {
    return NextResponse.json(
      { success: false, error: 'Webmail uchun avtorizatsiyadan o\'tilmagan (Faqat Admin / Pochta egasi)' },
      { status: 401 }
    );
  }

  try {
    const { searchParams } = new URL(req.url);
    const account = searchParams.get('account') || 'all';

    const emails: ParsedEmail[] = [];
    const accountsToCheck = account === 'all' ? ACCOUNTS : [account];

    for (const acc of accountsToCheck) {
      const maildir = path.join(MAIL_BASE_DIR, acc, '.maildir');
      if (!fs.existsSync(maildir)) continue;

      const folders = ['new', 'cur'];
      for (const folder of folders) {
        const folderPath = path.join(maildir, folder);
        if (!fs.existsSync(folderPath)) continue;

        const files = fs.readdirSync(folderPath);
        for (const file of files) {
          if (file.startsWith('.')) continue;
          const fullPath = path.join(folderPath, file);
          const parsed = parseEmailFile(acc, fullPath);
          if (parsed) emails.push(parsed);
        }
      }
    }

    // Sort by newest first
    emails.sort((a, b) => b.timestamp - a.timestamp);

    return NextResponse.json({
      success: true,
      total: emails.length,
      accounts: ACCOUNTS.map(a => `${a}@iportal.uz`),
      emails,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!checkMailAuth(req)) {
    return NextResponse.json({ success: false, error: 'Ruxsat berilmagan' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const account = searchParams.get('account');
    const id = searchParams.get('id');

    if (!account || !id) {
      return NextResponse.json({ success: false, error: 'Account va ID ko\'rsatilmadi' }, { status: 400 });
    }

    const maildir = path.join(MAIL_BASE_DIR, account, '.maildir');
    let deleted = false;

    for (const folder of ['new', 'cur']) {
      const targetPath = path.join(maildir, folder, id);
      if (fs.existsSync(targetPath)) {
        fs.unlinkSync(targetPath);
        deleted = true;
        break;
      }
    }

    return NextResponse.json({ success: deleted });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
