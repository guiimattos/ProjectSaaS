import { Queue, Worker, JobsOptions } from "bullmq";

const redisConnection = {
  host: process.env.REDIS_HOST ?? "127.0.0.1",
  port: Number(process.env.REDIS_PORT ?? 6379),
  password: process.env.REDIS_PASSWORD || undefined
};

export const integrationQueue = new Queue("integration-jobs", { connection: redisConnection });

export async function enqueueIntegrationJob(name: string, data: Record<string, unknown>, opts?: JobsOptions) {
  return integrationQueue.add(name, data, {
    attempts: 3,
    removeOnComplete: true,
    removeOnFail: false,
    ...opts
  });
}

export function createIntegrationWorker(
  handler: (name: string, data: Record<string, unknown>) => Promise<void>
) {
  return new Worker(
    "integration-jobs",
    async (job) => {
      await handler(job.name, (job.data as Record<string, unknown>) ?? {});
    },
    { connection: redisConnection }
  );
}
