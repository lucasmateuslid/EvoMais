import type { NextFunction, Request, Response } from 'express';
import { ZodError } from 'zod';

import { AppError } from '../errors/AppError.js';
import { logger } from '../logger.js';
import { getCorrelationId } from '../observability/requestContext.js';
import { Sentry } from '../sentry.js';

function toAppError(error: unknown) {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof ZodError) {
    return new AppError({
      code: 'validation_error',
      statusCode: 400,
      domain: 'validation',
      message: 'Invalid request payload.',
      details: error.flatten(),
    });
  }

  if (error && typeof error === 'object' && 'status' in error && 'message' in error) {
    const statusCode = Number((error as { status?: unknown }).status);
    if (!Number.isNaN(statusCode) && statusCode >= 400 && statusCode < 600) {
      return new AppError({
        code: statusCode >= 500 ? 'external_dependency_error' : 'request_error',
        statusCode,
        domain: statusCode >= 500 ? 'external' : 'application',
        message: String((error as { message: unknown }).message),
      });
    }
  }

  if (error && typeof error === 'object' && 'code' in error) {
    const dbCode = String((error as { code?: unknown }).code ?? '');
    if (dbCode === '23505') {
      return new AppError({
        code: 'resource_conflict',
        statusCode: 409,
        domain: 'database',
        message: 'Resource already exists.',
      });
    }
  }

  return new AppError({
    code: 'internal_server_error',
    statusCode: 500,
    domain: 'application',
    message: 'Unexpected error while processing request.',
  });
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const appError = toAppError(error);
  const correlationId = getCorrelationId();

  logger.error(
    {
      error,
      code: appError.code,
      domain: appError.domain,
      statusCode: appError.statusCode,
      details: appError.details,
      correlationId,
    },
    'handled backend error',
  );

  if (Sentry) {
    Sentry.captureException(error);
  }

  res.status(appError.statusCode).json({
    error: appError.code,
    code: appError.code,
    domain: appError.domain,
    message: appError.message,
    details: appError.details,
    correlationId,
  });
}