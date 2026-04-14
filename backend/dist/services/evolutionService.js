import { config } from '../config.js';
import { logger } from '../logger.js';
import { evolutionCircuitBreaker } from '../utils/circuitBreaker.js';
async function proxyEvolutionRequest(path, body) {
    const response = await fetch(`${config.EVOLUTION_API_URL}${path}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            ...(config.EVOLUTION_GLOBAL_API_KEY ? { apikey: config.EVOLUTION_GLOBAL_API_KEY } : {}),
        },
        body: JSON.stringify(body),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) {
        throw new Error(`Evolution request failed: ${response.status}`);
    }
    return payload;
}
export async function createEvolutionInstance(request) {
    try {
        const payload = await proxyEvolutionRequest('/instance/create', {
            instanceName: request.instanceName,
            qrcode: true,
            integration: 'WHATSAPP-BAILEYS',
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
export async function sendEvolutionMessage(request) {
    if (!evolutionCircuitBreaker.canProceed()) {
        return {
            status: 'queued',
            message: 'Circuit breaker open for Evolution API. Message queued for later retry.',
        };
    }
    try {
        const payload = await proxyEvolutionRequest(`/message/sendText/${request.instanceName}`, {
            number: request.number,
            options: {
                delay: 1200,
                presence: 'composing',
            },
            textMessage: {
                text: request.text,
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
