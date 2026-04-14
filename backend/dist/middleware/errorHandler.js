import { logger } from '../logger.js';
import { Sentry } from '../sentry.js';
export function errorHandler(error, _req, res, _next) {
    logger.error({ error }, 'unhandled backend error');
    if (Sentry) {
        Sentry.captureException(error);
    }
    res.status(500).json({
        error: 'internal_server_error',
        message: 'Unexpected error while processing request.',
    });
}
