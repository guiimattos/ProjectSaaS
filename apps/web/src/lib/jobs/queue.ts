import { Queue, Worker, JobsOptions } from "bullmq";

const redisConnection = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined,
};

export const QUEUE_NAME = "integration-jobs";
export const queueEnabled = Boolean(process.env.REDIS_HOST);

let queue: Queue | null = null;
function getQueue() {
  if (!queueEnabled) return null;
  return (queue ??= new Queue(QUEUE_NAME, { connection: redisConnection }));
}

/** Enfileira um job de integração. Sem Redis configurado, registra e segue (no-op). */
export async function enqueueIntegrationJob(name: string, data: Record<string, unknown>, opts?: JobsOptions) {
  const q = getQueue();
  if (!q) {
    console.info("[queue:skipped]", name, JSON.stringify(data));
    return { id: null };
  }
  return q.add(name, data, { attempts: 3, backoff: { type: "exponential", delay: 2000 }, removeOnComplete: true, removeOnFail: false, ...opts });
}

export function createIntegrationWorker(handler: (name: string, data: Record<string, unknown>) => Promise<void>) {
  return new Worker(QUEUE_NAME, async (job) => handler(job.name, (job.data as Record<string, unknown>) ?? {}), { connection: redisConnection });
}
