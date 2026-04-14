import * as Sentry from '@sentry/node';
import { config } from './config.js';
export function initializeSentry() {
    if (!config.SENTRY_DSN) {
        return false;
    }
    Sentry.init({
        dsn: config.SENTRY_DSN,
        environment: config.NODE_ENV,
        tracesSampleRate: 0.1,
    });
    return true;
}
export { Sentry };
