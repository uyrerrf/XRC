import crypto from 'node:crypto';
import { AUTH_SECRET, SESSION_HOURS } from '../config/env.js';

export interface TokenPayload {
  sub: string;
  exp: number;
}

export function signToken(payload: TokenPayload): string {
  const body = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  return `${body}.${sig}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [body, sig] = parts as [string, string];
  const expected = crypto.createHmac('sha256', AUTH_SECRET).update(body).digest('base64url');
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(Buffer.from(body, 'base64url').toString('utf8')) as TokenPayload;
    if (typeof payload.exp !== 'number' || payload.exp < Date.now()) return null;
    return payload;
  } catch {
    return null;
  }
}

export function issueToken(sub = 'admin'): { token: string; expiresAt: number } {
  const expiresAt = Date.now() + SESSION_HOURS * 3600_000;
  return { token: signToken({ sub, exp: expiresAt }), expiresAt };
}
