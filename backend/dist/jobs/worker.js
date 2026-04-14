import { Worker } from 'bullmq';
import { config } from '../config.js';
import { logger } from '../logger.js';
import { generateChatResponse } from '../services/aiService.js';
import { sendEvolutionMessage } from '../services/evolutionService.js';
import { queueNames } from './queue.js';
export function startWorkers() {
    if (!config.REDIS_URL) {
        return [];
    }
    const workers = [
        new Worker(queueNames.evolutionSend, async (job) => {
            return sendEvolutionMessage(job.data);
        }, {
            connection: {
                url: config.REDIS_URL,
            },
        }),
        new Worker(queueNames.aiAnalysis, async (job) => {
            return generateChatResponse(job.data);
        }, {
            connection: {
                url: config.REDIS_URL,
            },
        }),
    ];
    workers.forEach(worker => {
        worker.on('failed', (job, error) => {
            logger.error({ jobId: job?.id, error }, 'Queue job failed');
        });
    });
    return workers;
}
