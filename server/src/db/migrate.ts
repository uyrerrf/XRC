import { getSqlite } from './index.js';

/** Raw DDL, idempotent. Schema changes = add a statement here (v1 policy). */
export function migrate(): void {
  const db = getSqlite();
  db.exec(`
    CREATE TABLE IF NOT EXISTS devices (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      model TEXT NOT NULL,
      manufacturer TEXT NOT NULL,
      android TEXT NOT NULL,
      sdk INTEGER NOT NULL,
      carrier TEXT NOT NULL,
      signal INTEGER NOT NULL DEFAULT 0,
      battery INTEGER NOT NULL DEFAULT 0,
      temp REAL NOT NULL DEFAULT 0,
      ram_used REAL NOT NULL DEFAULT 0,
      ram_total REAL NOT NULL DEFAULT 0,
      storage_free REAL NOT NULL DEFAULT 0,
      storage_total REAL NOT NULL DEFAULT 0,
      ip_local TEXT NOT NULL DEFAULT '',
      ip_public TEXT NOT NULL DEFAULT '',
      city TEXT,
      skin TEXT,
      rooted INTEGER NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'offline',
      reconnect_attempts INTEGER NOT NULL DEFAULT 0,
      first_seen INTEGER NOT NULL,
      last_seen INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS event_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ts INTEGER NOT NULL,
      type TEXT NOT NULL,
      device_id TEXT,
      text TEXT NOT NULL,
      data TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_events_device ON event_logs(device_id);
    CREATE INDEX IF NOT EXISTS idx_events_ts ON event_logs(ts);
  `);
}
