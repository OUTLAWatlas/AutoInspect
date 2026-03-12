import { Worker, Job } from "bullmq";
import { processJob } from "./processor";

const connection = {
  host: process.env.REDIS_HOST ?? "redis",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

interface MonitorJobData {
  monitorId: string;
  url: string;
  selector?: string | null;
}

const worker = new Worker<MonitorJobData>(
  "monitor-queue",
  async (job: Job<MonitorJobData>) => {
    const { monitorId, url, selector } = job.data;

    console.log(`[job:${job.id}] Running monitor for ${url}`);

    const result = await processJob(monitorId, url, selector);

    console.log(
      `[job:${job.id}] Finished — ${result.status} (${result.loadTime}ms)`
    );

    return result;
  },
  {
    connection,
    concurrency: Number(process.env.WORKER_CONCURRENCY ?? 2),
    limiter: {
      max: 10,
      duration: 60_000,
    },
  }
);

worker.on("completed", (job) => {
  console.log(`[worker] Job ${job?.id} completed`);
});

worker.on("failed", (job, err) => {
  console.error(`[worker] Job ${job?.id} failed:`, err.message);
});

worker.on("error", (err) => {
  console.error("[worker] Worker error:", err);
});

console.log("[worker] Listening on queue: monitor-queue");
