import type { FastifyPluginAsync } from 'fastify';
import { getStats } from '../services/stats.js';

export const statsRoutes: FastifyPluginAsync = async (app) => {
  app.get('/stats', async () => ({ success: true, data: getStats() }));
};
