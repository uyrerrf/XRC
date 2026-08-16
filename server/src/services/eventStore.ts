import { and, count, desc, eq, gte, like } from 'drizzle-orm';
import type { LogEntry } from '@xrc/shared';
import { getDb } from '../db/index.js';
import { eventLogs, type EventLogRow } from '../db/schema.js';

function mapLog(r: EventLogRow): LogEntry {
  return { id: r.id, ts: r.ts, type: r.type as LogEntry['type'], deviceId: r.deviceId, text: r.text };
}

export function insertEvent(e: { ts: number; type: string; deviceId: string | null; text: string; data?: string }): void {
  const db = getDb();
  db.insert(eventLogs).values({ ts: e.ts, type: e.type, deviceId: e.deviceId, text: e.text, data: e.data ?? null }).run();
}

export function listEvents(opts: {
  type?: string;
  deviceId?: string;
  search?: string;
  page: number;
  pageSize: number;
}): { rows: LogEntry[]; total: number } {
  const db = getDb();
  const conds: ReturnType<typeof eq>[] = [];
  if (opts.type) conds.push(eq(eventLogs.type, opts.type));
  if (opts.deviceId) conds.push(eq(eventLogs.deviceId, opts.deviceId));
  if (opts.search) conds.push(like(eventLogs.text, `%${opts.search}%`));
  const where = conds.length ? and(...conds) : undefined;
  const total = db.select({ n: count() }).from(eventLogs).where(where).get()?.n ?? 0;
  const rows = db
    .select()
    .from(eventLogs)
    .where(where)
    .orderBy(desc(eventLogs.id))
    .limit(opts.pageSize)
    .offset((opts.page - 1) * opts.pageSize)
    .all();
  return { rows: rows.map(mapLog), total };
}

export function listDeviceEvents(deviceId: string, limit: number): LogEntry[] {
  const db = getDb();
  const rows = db
    .select()
    .from(eventLogs)
    .where(eq(eventLogs.deviceId, deviceId))
    .orderBy(desc(eventLogs.id))
    .limit(limit)
    .all();
  return rows.map(mapLog);
}

export function countEvents24h(type: string): number {
  const db = getDb();
  const since = Date.now() - 24 * 3600_000;
  const row = db
    .select({ n: count() })
    .from(eventLogs)
    .where(and(eq(eventLogs.type, type), gte(eventLogs.ts, since)))
    .get();
  return row?.n ?? 0;
}

export function countCommandsLike(pattern: string): number {
  const db = getDb();
  const row = db
    .select({ n: count() })
    .from(eventLogs)
    .where(and(eq(eventLogs.type, 'command'), like(eventLogs.text, pattern)))
    .get();
  return row?.n ?? 0;
}

export function clearEvents(): void {
  const db = getDb();
  db.delete(eventLogs).run();
}
