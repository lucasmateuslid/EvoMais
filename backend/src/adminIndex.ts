import 'dotenv/config';

import cors from 'cors';
import express from 'express';

import { config, backendCapabilities } from './config.js';
import { closeQueueConnections } from './jobs/queue.js';
import { withCorrelationId } from './middleware/correlationId.js';
import { securityHeaders } from './middleware/securityHeaders.js';
import { logger } from './logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestLogger } from './middleware/requestLogger.js';
import { adminRouter } from './routes/admin.js';
import { authRouter } from './routes/auth.js';
import { healthRouter } from './routes/health.js';
import { tenantRouter, tenantsRouter } from './routes/tenants.js';
import { initializeSentry } from './sentry.js';

initializeSentry();

if (backendCapabilities.ai) {
  logger.info(
    {
      aiProviders: backendCapabilities.aiProviders,
      aiProviderOrder: config.AI_PROVIDER_ORDER,
    },
    'admin backend ai providers configured',
  );
}

const app = express();

app.use(
  cors({
    origin: config.CORS_ORIGIN,
    credentials: true,
  }),
);
app.use(securityHeaders);
app.use(withCorrelationId);
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
    name: 'EvoMais Admin Backend',
    status: 'ok',
  });
});

app.use('/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tenant', tenantRouter);
app.use('/api/tenants', tenantsRouter);

app.use(errorHandler);

const server = app.listen(config.PORT, () => {
  logger.info({ port: config.PORT, environment: config.NODE_ENV }, 'admin backend listening');
});

async function shutdown(signal: string) {
  logger.info({ signal }, 'shutting down admin backend');

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