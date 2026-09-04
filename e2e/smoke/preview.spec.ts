import { test, expect } from "@playwright/test";
import {
  expectCoverULanding,
  expectDevelopersDocs,
  gotoPreviewPath,
} from "../helpers/preview";

/**
 * Minimal smoke suite for Vercel preview deployments.
 * Runs without starting a local web server (PLAYWRIGHT_BASE_URL is set in CI).
 */
test.describe("preview deployment smoke", () => {
  test("landing page is reachable", async ({ page }) => {
    await gotoPreviewPath(page, "/");
    await expectCoverULanding(page);
  });

  test("health endpoint responds", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const body = (await health.json()) as { status: string };
    expect(body.status).toBe("ok");
  });

  test("ready endpoint responds", async ({ request }) => {
    const ready = await request.get("/api/ready");
    expect(ready.status()).toBeLessThan(600);
    const body = (await ready.json()) as { status: string };
    expect(body.status).toBe("ready");
  });

  test("developers docs are reachable", async ({ page }) => {
    await gotoPreviewPath(page, "/developers");
    await expectDevelopersDocs(page);
  });
});
