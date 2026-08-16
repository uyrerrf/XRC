import type { FastifyPluginAsync } from 'fastify';
import { clearEvents, listEvents } from '../services/eventStore.js';

export const logsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/logs', async (request) => {
    const q = request.query as Record<string, string | undefined>;
    const page = Math.max(1, Number(q.page) || 1);
    const pageSize = Math.min(200, Math.max(1, Number(q.pageSize) || 50));
    const result = listEvents({
      type: q.type || undefined,
      deviceId: q.deviceId || undefined,
      search: q.search?.trim() || undefined,
      page,
      pageSize,
    });
    return { success: true, data: { logs: result.rows, total: result.total } };
  });

  app.delete('/logs', async () => {
    clearEvents();
    return { success: true };
  });
};
