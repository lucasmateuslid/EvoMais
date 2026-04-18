import { config } from '../config.js';
import { logger } from '../logger.js';
import { evolutionCircuitBreaker } from '../utils/circuitBreaker.js';
async function proxyEvolutionRequest(path, options) {
    const method = options?.method ?? 'POST';
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), config.EVOLUTION_REQUEST_TIMEOUT_MS);
    try {
        const response = await fetch(`${config.EVOLUTION_API_URL}${path}`, {
            method,
            headers: {
                'Content-Type': 'application/json',
                ...(config.EVOLUTION_GLOBAL_API_KEY ? { apikey: config.EVOLUTION_GLOBAL_API_KEY } : {}),
            },
            signal: controller.signal,
            ...(method === 'POST' ? { body: JSON.stringify(options?.body || {}) } : {}),
        });
        const payload = await response
            .json()
            .catch(async () => ({ raw: await response.text().catch(() => '') }));
        if (!response.ok) {
            throw new Error(`Evolution request failed: ${response.status}`);
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
        evolutionCircuitBreaker.recordFailure();
        logger.warn({ error, instanceName: request.instanceName }, 'Evolution instance creation failed');
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
        logger.warn({ error, instanceName }, 'Evolution reconnect failed');
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
        logger.warn({ error, instanceName: request.instanceName }, 'Evolution message send failed');
        return {
            status: 'queued',
            message: 'Evolution API unavailable. Message queued for retry.',
        };
    }
}
export function getEvolutionHealthSnapshot() {
    return {
        breaker: evolutionCircuitBreaker.snapshot(),
        apiUrl: config.EVOLUTION_API_URL,
    };
}
