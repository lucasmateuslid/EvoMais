import { Queue } from 'bullmq';
import { config } from '../config.js';


// Cria uma fila com as configurações padrão para tentativas, backoff e remoção de jobs antigos
function createQueue(name: string) {
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
} as const;

export async function enqueueJob<T>(queueName: string, payload: T) {
  const queue = createQueue(queueName);

  if (!queue) {
    return null;
  }

  const job = await queue.add(queueName, payload as Record<string, unknown>);

  return job.id;
}

export async function closeQueueConnections() {
  return Promise.resolve();
}

export function hasQueueBackend() {
  return Boolean(config.REDIS_URL);
}