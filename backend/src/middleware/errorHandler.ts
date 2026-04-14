import type { NextFunction, Request, Response } from 'express';

import { logger } from '../logger.js';
import { Sentry } from '../sentry.js';

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  logger.error({ error }, 'unhandled backend error');

  if (Sentry) {
    Sentry.captureException(error);
  }

  res.status(500).json({
    error: 'internal_server_error',
    message: 'Unexpected error while processing request.',
  });
}