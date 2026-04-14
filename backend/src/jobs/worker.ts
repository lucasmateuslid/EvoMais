import { Worker } from 'bullmq';

import { config } from '../config.js';
import { logger } from '../logger.js';
import { generateChatResponse } from '../services/aiService.js';
import { sendEvolutionMessage } from '../services/evolutionService.js';
import { queueNames } from './queue.js';

export type AppWorker = Worker;

export function startWorkers() {
  if (!config.REDIS_URL) {
    logger.warn('workers not started because REDIS_URL is missing');
    return [];
  }

  const workers = [
    new Worker(
      queueNames.evolutionSend,
      async job => {
        return sendEvolutionMessage(job.data);
      },
      {
        connection: {
          url: config.REDIS_URL,
        },
      },
    ),
    new Worker(
      queueNames.aiAnalysis,
      async job => {
        return generateChatResponse(job.data);
      },
      {
        connection: {
          url: config.REDIS_URL,
        },
      },
    ),
  ];

  workers.forEach(worker => {
    worker.on('ready', () => {
      logger.info({ queue: worker.name }, 'queue worker ready');
    });

    worker.on('failed', (job, error) => {
      logger.error({ jobId: job?.id, error }, 'Queue job failed');
    });
  });

  logger.info({ workerCount: workers.length }, 'queue workers started');

  return workers;
}

export async function stopWorkers(workers: AppWorker[]) {
  await Promise.all(workers.map(async worker => worker.close()));
  if (workers.length > 0) {
    logger.info({ workerCount: workers.length }, 'queue workers stopped');
  }
}