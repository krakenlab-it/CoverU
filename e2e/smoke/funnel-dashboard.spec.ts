import { expect, test } from "@playwright/test";
import { hasE2eAuth, loginAsTestUser } from "../helpers/auth";

/**
 * The funnel dashboard lives behind the app auth gate, so the unauthenticated
 * case is what CI can always assert: /app routes must not leak without a session.
 */
test.describe("funnel dashboard — auth gate", () => {
  test("redirects to login when there is no session", async ({ page }) => {
    await page.goto("/app/embudo");
    await expect(page).toHaveURL(/\/login/);
  });
});

test.describe("funnel dashboard — mobile 390x844", () => {
  test.use({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });

  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasE2eAuth()) {
      testInfo.skip(true, "Requires E2E_TEST_USER_* and Supabase env");
      return;
    }
    await loginAsTestUser(page, "/app/embudo");
  });

  test("shows every funnel step with a count", async ({ page }) => {
    await expect(
      page.getByRole("heading", { level: 1, name: "Embudo de conversión" }),
    ).toBeVisible();

    const counts = page.getByRole("region", { name: /Conteo por paso/i });
    await expect(counts).toBeVisible();

    for (const step of [
      "Lead capturado",
      "Cotización",
      "Solicitud de asesor",
    ]) {
      await expect(counts.getByText(step, { exact: true })).toBeVisible();
    }

    // Each step renders a number, even when it is an honest zero.
    const items = counts.getByRole("listitem");
    await expect(items).toHaveCount(3);
    for (let index = 0; index < 3; index += 1) {
      await expect(items.nth(index)).toContainText(/\d+ event/);
    }
  });

  test("states that health data is never recorded", async ({ page }) => {
    await expect(page.getByText(/Nunca incluyen datos de salud/)).toBeVisible();
  });

  test("is reachable from the panel navigation", async ({ page }) => {
    await page.goto("/app");
    await page.getByRole("link", { name: "Embudo" }).click();
    await expect(page).toHaveURL(/\/app\/embudo/);
  });

  test("stays usable at 390x844 without horizontal scrolling", async ({ page }) => {
    await page.goto("/app/embudo");
    await expect(
      page.getByRole("heading", { level: 1, name: "Embudo de conversión" }),
    ).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
