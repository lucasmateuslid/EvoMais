import { Queue } from 'bullmq';
import { config } from '../config.js';
// Cria uma fila com as configurações padrão para tentativas, backoff e remoção de jobs antigos
function createQueue(name) {
    if (!config.REDIS_URL) {
        return null;
    }
    return new Queue(name, {
        connection: {
            url: config.REDIS_URL,
        },
        defaultJobOptions: {
            attempts: 3,
            backoff: {
                type: 'exponential',
                delay: 1000,
            },
            removeOnComplete: 100,
            removeOnFail: 500,
        },
    });
}
export const queueNames = {
    aiAnalysis: 'ai-analysis',
    evolutionSend: 'evolution-send',
    webhookProcess: 'webhook-process',
};
export async function enqueueJob(queueName, payload) {
    const queue = createQueue(queueName);
    if (!queue) {
        return null;
    }
    const job = await queue.add(queueName, payload);
    return job.id;
}
export async function closeQueueConnections() {
    return Promise.resolve();
}
export function hasQueueBackend() {
    return Boolean(config.REDIS_URL);
}
