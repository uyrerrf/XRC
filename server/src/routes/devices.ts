import type { FastifyPluginAsync } from 'fastify';
import { deleteDevice, getDeviceById, listDeviceSummaries } from '../services/deviceStore.js';
import { listDeviceEvents } from '../services/eventStore.js';

export const devicesRoutes: FastifyPluginAsync = async (app) => {
  app.get('/devices', async () => {
    const devices = listDeviceSummaries();
    return { success: true, data: { devices, total: devices.length } };
  });

  app.get('/devices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    const device = getDeviceById(id);
    if (!device) return reply.code(404).send({ success: false, error: 'device not found' });
    return { success: true, data: device };
  });

  app.get('/devices/:id/events', async (request) => {
    const { id } = request.params as { id: string };
    const q = request.query as { limit?: string };
    const limit = Math.min(200, Math.max(1, Number(q.limit) || 50));
    return { success: true, data: listDeviceEvents(id, limit) };
  });

  app.delete('/devices/:id', async (request, reply) => {
    const { id } = request.params as { id: string };
    if (!deleteDevice(id)) return reply.code(404).send({ success: false, error: 'device not found' });
    return { success: true };
  });
};
