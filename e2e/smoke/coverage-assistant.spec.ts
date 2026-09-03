import { test, expect } from "@playwright/test";
import { DEMO_PLAN_VERSION_ID } from "../fixtures/demo";

test.describe("coverage assistant smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(`/app/marketplace/plans/${DEMO_PLAN_VERSION_ID}`);
  });

  test("known question returns citation-backed answer", async ({ page }) => {
    const history = page.getByLabel("Historial de conversación");

    await Promise.all([
      page.waitForResponse(
        (response) =>
          response.url().includes("/api/app/coverage/qa") && response.ok(),
      ),
      page
        .getByRole("button", { name: /¿Está cubierta la hospitalización/i })
        .click(),
    ]);

    await expect(history.getByText("Art. 4.1")).toBeVisible();
    await expect(
      history.getByText(/hospitalización/i).first(),
    ).toBeVisible();
  });

  test("unknown question abstains without citations", async ({ page }) => {
    await page.getByLabel(/Tu pregunta sobre cobertura/i).fill(
      "¿Cubren tratamiento en la luna?",
    );
    await page.getByRole("button", { name: "Preguntar" }).click();

    await expect(page.getByText("Sin respuesta en póliza")).toBeVisible();
    await expect(
      page.getByText(/No encontré respuesta en los documentos/i),
    ).toBeVisible();
  });
});
