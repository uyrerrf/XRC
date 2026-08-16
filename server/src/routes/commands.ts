import type { FastifyPluginAsync } from 'fastify';
import { socketService } from '../services/socket.js';
import { validateCommand } from '../services/validate.js';

export const commandsRoutes: FastifyPluginAsync = async (app) => {
  app.post('/devices/:id/command', async (request, reply) => {
    const { id } = request.params as { id: string };
    const body = (request.body ?? {}) as { command?: unknown };
    const parsed = validateCommand(body.command);
    if (!parsed.ok) return reply.code(400).send({ success: false, error: parsed.error });
    const res = socketService.sendCommand(id, parsed.value);
    if (!res.delivered) return reply.code(409).send({ success: false, error: res.error ?? 'device offline' });
    return { success: true, data: { delivered: true } };
  });

  app.post('/commands/bulk', async (request, reply) => {
    const body = (request.body ?? {}) as { deviceIds?: unknown; command?: unknown };
    const parsed = validateCommand(body.command);
    if (!parsed.ok) return reply.code(400).send({ success: false, error: parsed.error });
    const ids = Array.isArray(body.deviceIds) ? body.deviceIds.filter((x): x is string => typeof x === 'string') : [];
    const results = ids.map((id) => ({ id, delivered: socketService.sendCommand(id, parsed.value).delivered }));
    return { success: true, data: results };
  });
};
