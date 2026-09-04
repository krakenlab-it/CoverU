import { test, expect } from "@playwright/test";
import { expectCoverULanding } from "../helpers/preview";

test.describe("public site smoke", () => {
  test("landing page renders hero and Cover U chrome", async ({ page }) => {
    await page.goto("/");
    await expectCoverULanding(page);
  });

  test("comparator flow returns demo plans", async ({ page }) => {
    await page.goto("/comparar");
    await expect(
      page.getByRole("heading", { name: "Comparar planes" }),
    ).toBeVisible();

    await page.getByRole("button", { name: "Comparar planes" }).click();
    await expect(
      page.getByRole("region", { name: "Resultados de comparación" }),
    ).toBeVisible();
    await expect(page.getByText(/\[DEMO\]/).first()).toBeVisible();
  });

  test("developer docs page lists API endpoints", async ({ page }) => {
    await page.goto("/developers");
    await expect(
      page.getByRole("heading", { name: /Documentación para desarrolladores/i }),
    ).toBeVisible();
    await expect(page.getByRole("heading", { name: "Autenticación" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Endpoints" })).toBeVisible();
    await expect(page.getByText("get/api/v1/insurers")).toBeVisible();
  });

  test("health and readiness endpoints respond", async ({ request }) => {
    const health = await request.get("/api/health");
    expect(health.ok()).toBeTruthy();
    const healthBody = (await health.json()) as { status: string };
    expect(healthBody.status).toBe("ok");

    const ready = await request.get("/api/ready");
    expect(ready.ok()).toBeTruthy();
    const readyBody = (await ready.json()) as { status: string };
    expect(readyBody.status).toBe("ready");
  });
});
