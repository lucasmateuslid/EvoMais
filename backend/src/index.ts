import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { config, backendCapabilities } from './config.js';
import { closeQueueConnections } from './jobs/queue.js';
import { startWorkers, stopWorkers, type AppWorker } from './jobs/worker.js';
import { withCorrelationId } from './middleware/correlationId.js';
import { resolveTenantFromHost } from './middleware/tenant.js';
import { logger } from './logger.js';
import { initializeRealtime, shutdownRealtime } from './realtime/socket.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { aiRouter } from './routes/ai.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { chatRouter } from './routes/chat.js';
import { connectionsRouter } from './routes/connections.js';
import { crmRouter } from './routes/crm.js';
import { evolutionRouter } from './routes/evolution.js';
import { healthRouter } from './routes/health.js';
import { metricsRouter } from './routes/metrics.js';
import { tenantRouter, tenantsRouter } from './routes/tenants.js';
import { teamRouter } from './routes/team.js';
import { vendorsRouter } from './routes/vendors.js';
import { webhookRouter } from './routes/webhook.js';
import { initializeSentry } from './sentry.js';

initializeSentry();

let workers: AppWorker[] = [];

if (config.ENABLE_WORKERS && config.REDIS_URL) {
  workers = startWorkers();
} else {
  logger.info(
    {
      enableWorkers: config.ENABLE_WORKERS,
      hasRedisUrl: Boolean(config.REDIS_URL),
    },
    'queue workers disabled',
  );
}

if (backendCapabilities.ai) {
  logger.info(
    {
      aiProviders: backendCapabilities.aiProviders,
      aiProviderOrder: config.AI_PROVIDER_ORDER,
    },
    'ai providers configured',
  );
} else {
  logger.warn(
    {
      aiProviders: backendCapabilities.aiProviders,
      aiProviderOrder: config.AI_PROVIDER_ORDER,
    },
    'no ai provider configured',
  );
}

const app = express();

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(withCorrelationId);
app.use(resolveTenantFromHost);
app.use(
  express.json({
    limit: '1mb',
    verify: (req, _res, buffer) => {
      (req as { rawBody?: string }).rawBody = buffer.toString('utf8');
    },
  }),
);
app.use(requestLogger);

app.get('/', (_req, res) => {
  res.json({
    name: 'EvoMais Backend',
    status: 'ok',
  });
});

app.use('/health', healthRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tenants', tenantsRouter);
app.use('/api/team', teamRouter);
app.use('/api/ai', aiRouter);
app.use('/api/metrics', metricsRouter);
app.use('/api/vendors', vendorsRouter);
app.use('/api/chat', chatRouter);
app.use('/api/connections', connectionsRouter);
app.use('/api/crm', crmRouter);
app.use('/api/evolution', evolutionRouter);
app.use('/webhook', webhookRouter);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, environment: config.NODE_ENV }, 'backend listening');
});

initializeRealtime(server);

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down backend');

  server.close(async () => {
    await stopWorkers(workers);
    await shutdownRealtime();
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