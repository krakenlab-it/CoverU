import { test, expect } from "@playwright/test";
import { DEMO_PLAN_VERSION_ID } from "../fixtures/demo";
import { hasE2eAuth, isSupabaseConfigured, loginAsTestUser } from "../helpers/auth";

test.describe("login page", () => {
  test("shows real auth form or setup error (no demo bypass)", async ({ page }) => {
    await page.goto("/login");

    if (hasE2eAuth()) {
      await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
      await expect(page.getByLabel("Email")).toBeVisible();
      await expect(page.getByLabel("Contraseña")).toBeVisible();
      await expect(page.getByRole("button", { name: "Iniciar sesión" })).toBeVisible();
      await expect(page.getByText(/Entrar al panel demo/i)).toHaveCount(0);
    } else if (isSupabaseConfigured()) {
      await expect(page.getByRole("heading", { name: "Iniciar sesión" })).toBeVisible();
      await expect(page.getByText(/Entrar al panel demo/i)).toHaveCount(0);
    } else {
      await expect(page.getByText("Configuración requerida")).toBeVisible();
      await expect(page.getByText(/Entrar al panel demo/i)).toHaveCount(0);
    }
  });
});

test.describe("authenticated app smoke", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasE2eAuth()) {
      testInfo.skip(true, "Requires E2E_TEST_USER_* and Supabase env");
      return;
    }
    await loginAsTestUser(page);
  });

  test("login enters marketplace", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Marketplace de seguros" }),
    ).toBeVisible();
  });

  test("marketplace filtering updates results", async ({ page }) => {
    await page.goto("/app/marketplace");
    await expect(page.getByLabel("Filtros de búsqueda")).toBeVisible();

    await page.getByLabel("Edad").fill("30");
    await page.getByLabel("Género").selectOption("femenino");
    await page.getByLabel("Región").selectOption("Nacional");
    await page.getByRole("button", { name: "Aplicar filtros" }).click();

    await expect(page).toHaveURL(/age=30/);
    await expect(page.getByText(/\[DEMO\]/).first()).toBeVisible();
  });

  test("compare flow selects plans and opens matrix", async ({ page }) => {
    await page.goto(
      "/app/marketplace?age=30&gender=femenino&region=Nacional",
    );

    const compareButtons = page.getByRole("button", {
      name: /Agregar .* a la comparación/i,
    });
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
