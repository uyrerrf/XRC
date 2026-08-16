import type { FastifyInstance } from 'fastify';
import { authEnabled } from '../config/env.js';
import { verifyToken } from '../utils/auth.js';

/** Registers the Bearer-token guard. No-op unless PANEL_USER + PANEL_PASS are set. */
export function registerAuthGuard(app: FastifyInstance): void {
  if (!authEnabled) return;
  app.addHook('preHandler', async (request, reply) => {
    const url = request.url;
    if (url === '/api/health' || url.startsWith('/api/auth/')) return;
    if (!url.startsWith('/api')) return;
    const header = request.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;
    if (!token || !verifyToken(token)) {
      return reply.code(401).send({ success: false, error: 'unauthorized' });
    }
  });
}
