import { config } from '../config.js';
import { logger } from '../logger.js';
import { evolutionCircuitBreaker } from '../utils/circuitBreaker.js';
class EvolutionRequestError extends Error {
    statusCode;
    payload;
    constructor(message, statusCode, payload) {
        super(message);
        this.statusCode = statusCode;
        this.payload = payload;
        this.name = 'EvolutionRequestError';
    }
}
async function proxyEvolutionRequest(path, options) {
    const method = options?.method ?? 'POST';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.EVOLUTION_REQUEST_TIMEOUT_MS);
    const origin = config.EVOLUTION_REQUEST_ORIGIN ?? config.FRONTEND_URL;
    try {
        const response = await fetch(`${config.EVOLUTION_API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                Origin: origin,
                Referer: `${origin}/`,
                ...(config.EVOLUTION_GLOBAL_API_KEY ? { apikey: config.EVOLUTION_GLOBAL_API_KEY } : {}),
            },
            signal: controller.signal,
            ...(method === 'POST' ? { body: JSON.stringify(options?.body || {}) } : {}),
        });
        const payload = await response
            .json()
            .catch(async () => ({ raw: await response.text().catch(() => '') }));
        if (!response.ok) {
            const errorMessage = typeof payload === 'object' && payload !== null
                ? JSON.stringify(payload)
                : String(payload);
            throw new EvolutionRequestError(`Evolution request failed: ${response.status} ${errorMessage}`, response.status, payload);
        }
        return payload;
    }
    finally {
        clearTimeout(timeoutId);
    }
}
async function tryEvolutionRequest(path, options) {
    try {
        return await proxyEvolutionRequest(path, options);
    }
    catch (error) {
        logger.debug({ error, path, method: options?.method ?? 'POST' }, 'Evolution request attempt failed');
        return null;
    }
}
export async function createEvolutionInstance(request) {
    try {
        const payload = await proxyEvolutionRequest('/instance/create', {
            method: 'POST',
            body: {
                instanceName: request.instanceName,
                qrcode: true,
                integration: 'WHATSAPP-BAILEYS',
            },
        });
        evolutionCircuitBreaker.recordSuccess();
        return {
            status: 'sent',
            message: 'Instance creation request sent to Evolution API.',
            payload,
        };
    }
    catch (error) {
        const isConflict = error instanceof EvolutionRequestError
            && error.statusCode === 403
            && JSON.stringify(error.payload).includes('already in use');
        if (isConflict) {
            evolutionCircuitBreaker.recordSuccess();
            logger.warn({
                errorMessage: error.message,
                errorStack: error.stack,
                instanceName: request.instanceName,
                statusCode: error.statusCode,
            }, 'Evolution instance creation conflict');
            return {
                status: 'conflict',
                message: 'Evolution instance name is already in use.',
                payload: error.payload,
            };
        }
        evolutionCircuitBreaker.recordFailure();
        logger.warn({
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            instanceName: request.instanceName,
        }, 'Evolution instance creation failed');
        return {
            status: 'queued',
            message: 'Evolution API unavailable. Instance creation queued for retry.',
        };
    }
}
export async function reconnectEvolutionInstance(instanceName) {
    if (!evolutionCircuitBreaker.canProceed()) {
        return {
            status: 'queued',
            message: 'Circuit breaker open for Evolution API. Reconnect queued for later retry.',
        };
    }
    try {
        const attempts = await Promise.all([
            tryEvolutionRequest(`/instance/connect/${instanceName}`, { method: 'POST', body: {} }),
            tryEvolutionRequest(`/instance/connect/${instanceName}`, { method: 'GET' }),
            tryEvolutionRequest(`/instance/qrcode/${instanceName}`, { method: 'GET' }),
            tryEvolutionRequest(`/instance/qrcode/${instanceName}`, { method: 'POST', body: {} }),
        ]);
        const payload = attempts.find(Boolean);
        if (!payload) {
            throw new Error('No valid reconnect/qrcode response from Evolution API');
        }
        evolutionCircuitBreaker.recordSuccess();
        return {
            status: 'sent',
            message: 'Reconnect request sent to Evolution API.',
            payload,
        };
    }
    catch (error) {
        evolutionCircuitBreaker.recordFailure();
        logger.warn({
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            instanceName,
        }, 'Evolution reconnect failed');
        return {
            status: 'failed',
            message: 'Evolution API unavailable during reconnect.',
        };
    }
}
export async function sendEvolutionMessage(request) {
    if (!evolutionCircuitBreaker.canProceed()) {
        return {
            status: 'queued',
            message: 'Circuit breaker open for Evolution API. Message queued for later retry.',
        };
    }
    try {
        const payload = await proxyEvolutionRequest(`/message/sendText/${request.instanceName}`, {
            method: 'POST',
            body: {
                number: request.number,
                options: {
                    delay: 1200,
                    presence: 'composing',
                },
                textMessage: {
                    text: request.text,
                },
            },
        });
        evolutionCircuitBreaker.recordSuccess();
        return {
            status: 'sent',
            message: 'Message sent to Evolution API.',
            payload,
        };
    }
    catch (error) {
        evolutionCircuitBreaker.recordFailure();
        logger.warn({
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            instanceName: request.instanceName,
        }, 'Evolution message send failed');
        return {
            status: 'queued',
            message: 'Evolution API unavailable. Message queued for retry.',
        };
    }
}
export async function restartEvolutionInstance(instanceName) {
    if (!evolutionCircuitBreaker.canProceed()) {
        return {
            status: 'queued',
            message: 'Circuit breaker open for Evolution API. Restart queued for later retry.',
        };
    }
    try {
        const payload = await proxyEvolutionRequest(`/instance/restart/${instanceName}`, {
            method: 'POST',
            body: {},
        });
        evolutionCircuitBreaker.recordSuccess();
        return {
            status: 'sent',
            message: 'Restart request sent to Evolution API.',
            payload,
        };
    }
    catch (error) {
        evolutionCircuitBreaker.recordFailure();
        logger.warn({
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            instanceName,
        }, 'Evolution restart failed');
        return {
            status: 'failed',
            message: 'Evolution API unavailable during restart.',
        };
    }
}
export async function deleteEvolutionInstance(instanceName) {
    if (!evolutionCircuitBreaker.canProceed()) {
        return {
            status: 'queued',
            message: 'Circuit breaker open for Evolution API. Delete queued for later retry.',
        };
    }
    try {
        const payload = await proxyEvolutionRequest(`/instance/delete/${instanceName}`, {
            method: 'POST',
            body: {},
        });
        evolutionCircuitBreaker.recordSuccess();
        return {
            status: 'sent',
            message: 'Delete request sent to Evolution API.',
            payload,
        };
    }
    catch (error) {
        evolutionCircuitBreaker.recordFailure();
        logger.warn({
            errorMessage: error instanceof Error ? error.message : String(error),
            errorStack: error instanceof Error ? error.stack : undefined,
            instanceName,
        }, 'Evolution delete failed');
        return {
            status: 'failed',
            message: 'Evolution API unavailable during delete.',
        };
    }
}
export function getEvolutionHealthSnapshot() {
    return {
        breaker: evolutionCircuitBreaker.snapshot(),
        apiUrl: config.EVOLUTION_API_URL,
    };
}
