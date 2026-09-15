// Processo separado: `npm run worker`. Mantém o worker BullMQ vivo fora do Next.
import { worker } from "@/lib/jobs/worker";

worker.on("completed", (job) => console.info(`[worker] ${job.name} #${job.id} ok`));
worker.on("failed", (job, err) => console.error(`[worker] ${job?.name} #${job?.id} failed:`, err.message));
console.info("[worker] integration-jobs worker started");

const shutdown = async () => { await worker.close(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
