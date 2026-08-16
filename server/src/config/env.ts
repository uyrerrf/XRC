import path from 'node:path';

const portRaw = process.env.PORT ?? '3000';
export const PORT = Number.isFinite(Number(portRaw)) ? Number(portRaw) : 3000;

export const HOST = process.env.HOST ?? '0.0.0.0';
export const NODE_ENV = process.env.NODE_ENV ?? 'development';
export const IS_PROD = NODE_ENV === 'production';

const trustProxyRaw = (process.env.TRUST_PROXY ?? 'loopback').trim();
export const TRUST_PROXY: unknown =
  trustProxyRaw === ''
    ? 'loopback'
    : trustProxyRaw === '1' || trustProxyRaw.toLowerCase() === 'true'
      ? true
      : trustProxyRaw;

export const DATABASE_PATH =
  process.env.DATABASE_PATH ?? path.resolve(process.cwd(), 'data', 'xrc.db');

export const AUTH_SECRET = process.env.BETTER_AUTH_SECRET ?? 'xrc-dev-secret-change-me';
export const PANEL_USER = process.env.PANEL_USER ?? '';
export const PANEL_PASS = process.env.PANEL_PASS ?? '';
export const authEnabled = PANEL_USER.length > 0 && PANEL_PASS.length > 0;
export const SESSION_HOURS = 12;
