import express from "express";
import cron from "node-cron";
import { PrismaClient } from "../../shared/generated/prisma";
import monitorRoutes from "./routes/monitor";
import { enqueueMonitor } from "./queue/producer";

const app = express();
const prisma = new PrismaClient();
const PORT = Number(process.env.PORT ?? 4000);

app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/monitors", monitorRoutes);

// Scheduler: every minute, find monitors due for a check and enqueue them
cron.schedule("* * * * *", async () => {
  const now = new Date();

  const monitors = await prisma.monitor.findMany({
    where: { active: true },
  });

  for (const monitor of monitors) {
    const lastRun = monitor.lastRun?.getTime() ?? 0;
    const dueAt = lastRun + monitor.interval * 1000;

    if (now.getTime() >= dueAt) {
      await enqueueMonitor({
        monitorId: monitor.id,
        url: monitor.url,
        selector: monitor.selector,
      });

      await prisma.monitor.update({
        where: { id: monitor.id },
        data: { lastRun: now },
      });

      console.log(`[scheduler] Enqueued monitor ${monitor.id} (${monitor.url})`);
    }
  }
});

app.listen(PORT, () => {
  console.log(`[api] Listening on port ${PORT}`);
});
