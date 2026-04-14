import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { config } from './config.js';
import { closeQueueConnections } from './jobs/queue.js';
import { startWorkers } from './jobs/worker.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { aiRouter } from './routes/ai.js';
import { authRouter } from './routes/auth.js';
import { connectionsRouter } from './routes/connections.js';
import { crmRouter } from './routes/crm.js';
import { evolutionRouter } from './routes/evolution.js';
import { healthRouter } from './routes/health.js';
import { teamRouter } from './routes/team.js';
import { webhookRouter } from './routes/webhook.js';
import { initializeSentry } from './sentry.js';

initializeSentry();
// Redis desabilitado em desenvolvimento (sem REDIS_URL configurado)
// Descomente quando tiver Redis rodando:
// startWorkers();

const app = express();

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({
    name: 'EvoMais Backend',
    status: 'ok',
  });
});

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/team', teamRouter);
app.use('/api/ai', aiRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/crm', crmRouter);
app.use('/api/evolution', evolutionRouter);
app.use('/webhook', webhookRouter);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, environment: config.NODE_ENV }, 'backend listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down backend');

  server.close(async () => {
    await closeQueueConnections();
    process.exit(0);
  });
}

process.on('SIGINT', () => {
  void shutdown('SIGINT');
});

process.on('SIGTERM', () => {
  void shutdown('SIGTERM');
});