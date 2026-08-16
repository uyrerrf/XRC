import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';
import { DATABASE_PATH } from '../config/env.js';

let sqlite: Database.Database | null = null;
let db: BetterSQLite3Database<typeof schema> | null = null;

export function initDb(): void {
  fs.mkdirSync(path.dirname(DATABASE_PATH), { recursive: true });
  sqlite = new Database(DATABASE_PATH);
  sqlite.pragma('journal_mode = WAL');
  sqlite.pragma('foreign_keys = ON');
  db = drizzle(sqlite, { schema });
}

export function getDb(): BetterSQLite3Database<typeof schema> {
  if (!db) throw new Error('db not initialized');
  return db;
}

export function getSqlite(): Database.Database {
  if (!sqlite) throw new Error('db not initialized');
  return sqlite;
}

export function closeDb(): void {
  sqlite?.close();
  sqlite = null;
  db = null;
}
