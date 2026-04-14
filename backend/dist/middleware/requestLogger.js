import { logger } from '../logger.js';
import { getCorrelationId } from '../observability/requestContext.js';
export function requestLogger(req, res, next) {
    const startedAt = Date.now();
    res.on('finish', () => {
        const durationMs = Date.now() - startedAt;
        logger.info({
            method: req.method,
            path: req.originalUrl,
            statusCode: res.statusCode,
            durationMs,
            correlationId: getCorrelationId(),
        }, 'request completed');
    });
    next();
}
