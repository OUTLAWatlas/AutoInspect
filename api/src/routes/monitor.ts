import { Router, Request, Response } from "express";
import { PrismaClient } from "../../../shared/generated/prisma";
import { enqueueMonitor } from "../queue/producer";

const router = Router();
const prisma = new PrismaClient();

// POST /monitors — create a new monitor and enqueue its first check
router.post("/", async (req: Request, res: Response) => {
  const { url, interval, selector } = req.body;

  if (!url || typeof url !== "string") {
    res.status(400).json({ error: "url is required" });
    return;
  }

  const monitor = await prisma.monitor.create({
    data: {
      url,
      interval: interval ?? 300,
      selector: selector ?? null,
    },
  });

  await enqueueMonitor({
    monitorId: monitor.id,
    url: monitor.url,
    selector: monitor.selector,
  });

  await prisma.monitor.update({
    where: { id: monitor.id },
    data: { lastRun: new Date() },
  });

  res.status(201).json(monitor);
});

// GET /monitors — list all active monitors
router.get("/", async (_req: Request, res: Response) => {
  const monitors = await prisma.monitor.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
  });
  res.json(monitors);
});

// GET /monitors/:id/results — latest test results for a monitor
router.get("/:id/results", async (req: Request, res: Response) => {
  const { id } = req.params;

  const monitor = await prisma.monitor.findUnique({ where: { id } });
  if (!monitor) {
    res.status(404).json({ error: "Monitor not found" });
    return;
  }

  const results = await prisma.testResult.findMany({
    where: { monitorId: id },
    orderBy: { timestamp: "desc" },
    take: 20,
  });

  res.json(results);
});

export default router;
