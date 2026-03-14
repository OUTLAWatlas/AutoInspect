import { spawn } from "node:child_process";
import path from "node:path";
import { startServer } from "./index";

function runPrismaDbPush(): Promise<void> {
  const prismaCliPath = require.resolve("prisma/build/index.js");
  const schemaPath = path.resolve(__dirname, "../../shared/prisma/schema.prisma");

  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [prismaCliPath, "db", "push", "--schema", schemaPath, "--skip-generate"],
      {
        stdio: "inherit",
      },
    );

    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(new Error(`Prisma db push failed with exit code ${code ?? "unknown"}`));
    });
  });
}

async function main(): Promise<void> {
  await runPrismaDbPush();
  startServer();
}

main().catch((error: unknown) => {
  console.error("[api] Startup failed", error);
  process.exit(1);
});