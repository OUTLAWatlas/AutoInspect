import { Builder, By, until, WebDriver } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";
import { PrismaClient } from "../../shared/generated/prisma";

const prisma = new PrismaClient();

export interface MonitorResult {
  status: "PASS" | "FAIL";
  loadTime: number;
  error?: string;
}

function getDriver(): Promise<WebDriver> {
  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1920,1080"
  );

  return new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();
}

export async function processJob(
  monitorId: string,
  url: string,
  selector?: string | null
): Promise<MonitorResult> {
  const driver = await getDriver();
  await driver.manage().setTimeouts({ implicit: 5000 });

  let status: "PASS" | "FAIL" = "FAIL";
  let loadTime = -1;
  let errorMessage: string | undefined;

  try {
    const start = performance.now();

    await driver.get(url);

    if (selector) {
      await driver.wait(until.elementLocated(By.css(selector)), 15_000);
    }

    loadTime = Math.round(performance.now() - start);
    status = "PASS";
  } catch (err: unknown) {
    errorMessage = err instanceof Error ? err.message : String(err);
  } finally {
    await driver.quit();
  }

  await prisma.testResult.create({
    data: {
      monitorId,
      status,
      loadTime,
      error: errorMessage,
    },
  });

  await prisma.monitor.update({
    where: { id: monitorId },
    data: { lastRun: new Date() },
  });

  return { status, loadTime, error: errorMessage };
}
