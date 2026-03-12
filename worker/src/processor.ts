import { Builder, By, until } from "selenium-webdriver";
import chrome from "selenium-webdriver/chrome";

export interface MonitorResult {
  success: boolean;
  loadTime: number;
  error?: string;
}

export async function runMonitor(
  url: string,
  selector?: string | null
): Promise<MonitorResult> {
  const options = new chrome.Options();
  options.addArguments(
    "--headless=new",
    "--no-sandbox",
    "--disable-dev-shm-usage",
    "--disable-gpu",
    "--window-size=1920,1080"
  );

  const driver = await new Builder()
    .forBrowser("chrome")
    .setChromeOptions(options)
    .build();

  try {
    const start = performance.now();

    await driver.get(url);

    if (selector) {
      await driver.wait(until.elementLocated(By.css(selector)), 15_000);
    }

    const loadTime = Math.round(performance.now() - start);

    return { success: true, loadTime };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return { success: false, loadTime: -1, error: message };
  } finally {
    await driver.quit();
  }
}
