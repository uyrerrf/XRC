import type { FastifyPluginAsync } from 'fastify';
import { authEnabled, PANEL_PASS, PANEL_USER } from '../config/env.js';
import { issueToken } from '../utils/auth.js';

export const authRoutes: FastifyPluginAsync = async (app) => {
  app.post('/auth/login', async (request, reply) => {
    const body = (request.body ?? {}) as { username?: unknown; password?: unknown };
    if (!authEnabled) {
      const t = issueToken();
      return { success: true, data: { token: t.token, expiresAt: t.expiresAt, authEnabled: false } };
    }
    if (body.username === PANEL_USER && body.password === PANEL_PASS) {
      const t = issueToken();
      return { success: true, data: { token: t.token, expiresAt: t.expiresAt, authEnabled: true } };
    }
    return reply.code(401).send({ success: false, error: 'invalid credentials' });
  });

  app.get('/auth/status', async () => ({ success: true, data: { authEnabled } }));
};
