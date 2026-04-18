import pino from 'pino';
import { config } from './config.js';
import { getCorrelationId } from './observability/requestContext.js';
export const logger = pino({
    level: config.NODE_ENV === 'production' ? 'info' : 'debug',
    base: {
        service: 'evomais-backend',
    },
    mixin() {
        const correlationId = getCorrelationId();
        return correlationId ? { correlationId } : {};
    },
    transport: config.NODE_ENV === 'production'
        ? undefined
        : {
            target: 'pino-pretty',
            options: {
                colorize: true,
                translateTime: 'SYS:standard',
                ignore: 'pid,hostname',
                singleLine: false,
            },
        },
});
