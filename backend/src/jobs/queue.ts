import { Queue } from 'bullmq';

import { config } from '../config.js';

const queueCache = new Map<string, Queue>();

const defaultJobOptions = {
  attempts: 3,
  backoff: {
    type: 'exponential' as const,
    delay: 1000,
  },
  removeOnComplete: {
    age: 3600,
    count: 100,
  },
  removeOnFail: {
    age: 86_400,
    count: 500,
  },
};


// Cria uma fila com as configurações padrão para tentativas, backoff e remoção de jobs antigos
function createQueue(name: string) {
  if (!config.REDIS_URL) {
    return null;
  }

  const existingQueue = queueCache.get(name);

  if (existingQueue) {
    return existingQueue;
  }

  const queue = new Queue(name, {
    connection: {
      url: config.REDIS_URL,
      maxRetriesPerRequest: null,
      enableReadyCheck: false,
    },
    defaultJobOptions,
  });

  queueCache.set(name, queue);

  return queue;
}

export const queueNames = {
  aiAnalysis: 'ai-analysis',
  evolutionSend: 'evolution-send',
  webhookProcess: 'webhook-process',
} as const;

export async function enqueueJob<T>(queueName: string, payload: T, options?: { jobId?: string; delay?: number; priority?: number }) {
  const queue = createQueue(queueName);

  if (!queue) {
    throw new Error('Redis queue backend is not configured.');
  }

  const job = await queue.add(queueName, payload as Record<string, unknown>, {
    jobId: options?.jobId,
    delay: options?.delay,
    priority: options?.priority,
  });

  return job.id ?? null;
}

export async function closeQueueConnections() {
  await Promise.all([...queueCache.values()].map(async queue => queue.close()));
  queueCache.clear();
}

export function hasQueueBackend() {
  return Boolean(config.REDIS_URL);
}