import { Queue } from "bullmq";

const connection = {
  host: process.env.REDIS_HOST ?? "redis",
  port: Number(process.env.REDIS_PORT ?? 6379),
};

export const monitorQueue = new Queue("monitor-queue", { connection });

export interface MonitorJobData {
  monitorId: string;
  url: string;
  selector?: string | null;
}

export async function enqueueMonitor(data: MonitorJobData): Promise<void> {
  await monitorQueue.add("check", data, {
    removeOnComplete: 100,
    removeOnFail: 200,
  });
}
