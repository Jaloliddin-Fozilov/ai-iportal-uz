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

  // 1. Direct password auth token
  if (MAIL_PASSWORDS.includes(token) || token === process.env.ADMIN_PASSWORD) {
    return true;
  }

  // 2. Master Key check
  if (token === process.env.IPORTAL_MASTER_KEY || token === 'ip-master-secret-key-change-me') {
    return true;
  }

  // 3. User JWT session check (Admin only)
  const { valid, payload } = verifySessionToken(token);
  if (valid && payload) {
    const user = findUserById(payload.userId);
    if (user && user.role === 'admin') return true;
  }

  return false;
}

interface ParsedEmail {
  id: string;
  account: string;
  from: string;
  to: string;
  subject: string;
  date: string;
  timestamp: number;
  body: string;
  preview: string;
  isHtml: boolean;
  rawFile: string;
}

function parseEmailFile(account: string, filePath: string): ParsedEmail | null {
  try {
    const raw = fs.readFileSync(filePath, 'utf-8');
    const parts = raw.split(/\r?\n\r?\n/);
    const headersRaw = parts[0] || '';
    const bodyRaw = parts.slice(1).join('\n\n');

    let from = 'Noma\'lum';
    let to = `${account}@iportal.uz`;
    let subject = '(Mavzu yo\'q)';
    let date = new Date().toLocaleString();
    let timestamp = fs.statSync(filePath).mtimeMs;

    const fromMatch = headersRaw.match(/^From:\s*(.+)$/im);
    if (fromMatch) from = fromMatch[1].trim();

    const toMatch = headersRaw.match(/^To:\s*(.+)$/im);
    if (toMatch) to = toMatch[1].trim();

    const subjectMatch = headersRaw.match(/^Subject:\s*(.+)$/im);
    if (subjectMatch) subject = subjectMatch[1].trim();

    const dateMatch = headersRaw.match(/^Date:\s*(.+)$/im);
    if (dateMatch) {
      date = dateMatch[1].trim();
      const parsedTime = Date.parse(date);
      if (!isNaN(parsedTime)) timestamp = parsedTime;
    }

    const preview = bodyRaw.replace(/<[^>]*>/g, '').slice(0, 140).trim();

    return {
      id: path.basename(filePath),
      account,
      from,
      to,
      subject,
      date,
      timestamp,
      body: bodyRaw,
      preview: preview || '(Xabar matni bo\'sh)',
      isHtml: bodyRaw.includes('<html') || bodyRaw.includes('<body') || bodyRaw.includes('</div>'),
      rawFile: filePath,
    };
  } catch (err) {
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
