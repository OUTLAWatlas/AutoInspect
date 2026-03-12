import { Worker, Job } from "bullmq";
import { runMonitor } from "./processor";
import { PrismaClient } from "../../shared/generated/prisma";

const connection = {
  host: process.env.REDIS_HOST ?? "redis",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

const prisma = new PrismaClient();

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

    const result = await runMonitor(url, selector);

    await prisma.testResult.create({
      data: {
        monitorId,
        status: result.success ? "pass" : "fail",
        loadTime: result.loadTime,
        error: result.error,
      },
    });

    console.log(
      `[job:${job.id}] Finished — ${result.success ? "pass" : "fail"} (${result.loadTime}ms)`
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
