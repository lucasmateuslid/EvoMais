import { randomUUID } from 'node:crypto';
import type { NextFunction, Request, Response } from 'express';

import { config } from '../config.js';
import { runWithRequestContext } from '../observability/requestContext.js';

function resolveCorrelationId(req: Request) {
  const explicitId = req.header('x-correlation-id') || req.header('x-request-id');

  if (explicitId && explicitId.trim().length > 0) {
    return explicitId.trim();
  }

  return randomUUID();
}

export function withCorrelationId(req: Request, res: Response, next: NextFunction) {
  if (!config.LOG_CORRELATION_ID) {
    return next();
  }

  const correlationId = resolveCorrelationId(req);
  res.setHeader('x-correlation-id', correlationId);

  runWithRequestContext({ correlationId }, () => {
    next();
  });
}
