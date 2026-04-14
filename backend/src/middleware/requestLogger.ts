import type { NextFunction, Request, Response } from 'express';

import { logger } from '../logger.js';

export function requestLogger(req: Request, res: Response, next: NextFunction) {
  const startedAt = Date.now();

  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;

    logger.info(
      {
        method: req.method,
        path: req.originalUrl,
        statusCode: res.statusCode,
        durationMs,
      },
      'request completed',
    );
  });

  next();
}