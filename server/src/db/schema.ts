import { integer, real, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const devices = sqliteTable('devices', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  model: text('model').notNull(),
  manufacturer: text('manufacturer').notNull(),
  android: text('android').notNull(),
  sdk: integer('sdk').notNull(),
  carrier: text('carrier').notNull(),
  signal: integer('signal').notNull().default(0),
  battery: integer('battery').notNull().default(0),
  temp: real('temp').notNull().default(0),
  ramUsed: real('ram_used').notNull().default(0),
  ramTotal: real('ram_total').notNull().default(0),
  storageFree: real('storage_free').notNull().default(0),
  storageTotal: real('storage_total').notNull().default(0),
  ipLocal: text('ip_local').notNull().default(''),
  ipPublic: text('ip_public').notNull().default(''),
  city: text('city'),
  skin: text('skin'),
  rooted: integer('rooted', { mode: 'boolean' }).notNull().default(false),
  status: text('status', { enum: ['online', 'offline', 'frozen'] })
    .notNull()
    .default('offline'),
  reconnectAttempts: integer('reconnect_attempts').notNull().default(0),
  firstSeen: integer('first_seen').notNull(),
  lastSeen: integer('last_seen').notNull(),
});

export const eventLogs = sqliteTable('event_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  ts: integer('ts').notNull(),
  type: text('type').notNull(),
  deviceId: text('device_id'),
  text: text('text').notNull(),
  data: text('data'),
});

export type DeviceRow = typeof devices.$inferSelect;
export type EventLogRow = typeof eventLogs.$inferSelect;
