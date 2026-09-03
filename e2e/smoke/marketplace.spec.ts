import { test, expect } from "@playwright/test";
import { DEMO_PLAN_VERSION_ID } from "../fixtures/demo";

test.describe("demo app smoke", () => {
  test("login demo mode enters marketplace", async ({ page }) => {
    await page.goto("/login");
    await expect(page.getByText("Modo demo:", { exact: false }).first()).toBeVisible();
    await page.getByRole("button", { name: "Entrar al panel demo" }).click();
    await expect(page).toHaveURL(/\/app/);
    await expect(
      page.getByRole("heading", { name: "Marketplace de seguros" }),
    ).toBeVisible();
  });

  test("marketplace filtering updates results", async ({ page }) => {
    await page.goto("/app/marketplace");
    await expect(page.getByLabel("Filtros de búsqueda")).toBeVisible();

    await page.getByLabel("Edad").fill("30");
    await page.getByLabel("Género").selectOption("femenino");
    await page.getByLabel("Región").selectOption("metropolitana");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    await expect(page).toHaveURL(/age=30/);
    await expect(page.getByText(/\[DEMO\]/).first()).toBeVisible();
  });

  test("compare flow selects plans and opens matrix", async ({ page }) => {
    await page.goto(
      "/app/marketplace?age=30&gender=femenino&region=metropolitana",
    );

    const compareButtons = page.getByRole("button", { name: /Agregar .* a la comparación/i });
    await compareButtons.first().click();
    await compareButtons.nth(1).click();

    await page.getByRole("link", { name: "Ver comparación" }).click();
    await expect(page).toHaveURL(/\/app\/marketplace\/compare/);
    await expect(page.getByRole("heading", { name: "Comparar planes" })).toBeVisible();
  });

  test("plan detail shows policy viewer and assistant", async ({ page }) => {
    await page.goto(`/app/marketplace/plans/${DEMO_PLAN_VERSION_ID}`);
    await expect(
      page.getByRole("heading", { name: "[DEMO] Plan Básico Alpha" }),
    ).toBeVisible();
    await expect(
      page.getByRole("heading", { name: "Asistente de cobertura" }),
    ).toBeVisible();
  });
});
