import { expect, test } from "@playwright/test";
import {
  MOBILE_VIEWPORT,
  QUOTE_BUDGET_MS,
  openQuoter,
  quoteResults,
  submitProfile,
} from "../helpers/quoter";

test.use({ viewport: MOBILE_VIEWPORT, isMobile: true, hasTouch: true });

test.describe("public quoter — mobile 390x844", () => {
  test("reaches a quote from the real catalog in under two minutes", async ({
    page,
  }) => {
    const startedAt = Date.now();

    await openQuoter(page);
    await submitProfile(page, {
      age: "30",
      gender: "femenino",
      region: "Sierra",
    });

    const results = quoteResults(page);
    await expect(results).toBeVisible({ timeout: QUOTE_BUDGET_MS });
    await expect(results.getByText("Desde")).toBeVisible();
    await expect(results.getByText(/planes? para tu perfil/)).toBeVisible();

    // Prices come from the v1.3 catalog, so no demo badge appears.
    await expect(page.getByTitle("DEMO — datos de ejemplo")).toHaveCount(0);

    const cards = results.getByRole("listitem");
    expect(await cards.count()).toBeGreaterThan(0);
    await expect(cards.first().getByText("Prima mensual")).toBeVisible();

    expect(Date.now() - startedAt).toBeLessThan(QUOTE_BUDGET_MS);
  });

  test("quotes every v1.3 insurer that prices the region", async ({ page }) => {
    await openQuoter(page);
    await submitProfile(page, {
      age: "45",
      gender: "masculino",
      region: "Sierra",
    });
    await expect(quoteResults(page)).toBeVisible({ timeout: QUOTE_BUDGET_MS });

    const offers = await page.request.get(
      "/api/compare?age=45&gender=masculino&region=Sierra",
    );
    expect(offers.ok()).toBeTruthy();
    const body = (await offers.json()) as { offers: { insurerName: string }[] };
    const insurers = [...new Set(body.offers.map((offer) => offer.insurerName))];
    expect(insurers.sort()).toEqual(["BMI", "Confiamed", "Saludsa"]);
  });

  test("national quotes come only from carriers with national tariffs", async ({
    page,
  }) => {
    await openQuoter(page);
    await submitProfile(page, {
      age: "45",
      gender: "masculino",
      region: "Nacional",
    });
    await expect(quoteResults(page)).toBeVisible({ timeout: QUOTE_BUDGET_MS });

    const offers = await page.request.get(
      "/api/compare?age=45&gender=masculino&region=Nacional",
    );
    expect(offers.ok()).toBeTruthy();
    const body = (await offers.json()) as {
      offers: { insurerName: string; region: string }[];
    };
    const insurers = [...new Set(body.offers.map((offer) => offer.insurerName))];
    expect(insurers.sort()).toEqual(["Confiamed", "Saludsa"]);
    expect(body.offers.every((offer) => offer.region === "Nacional")).toBe(true);
  });

  test("updating the profile refreshes the quoted tariffs", async ({ page }) => {
    await openQuoter(page);
    await submitProfile(page, {
      age: "30",
      gender: "femenino",
      region: "Nacional",
    });

    const results = quoteResults(page);
    await expect(results).toBeVisible({ timeout: QUOTE_BUDGET_MS });
    const summary = results.locator("div").first();
    const firstSummary = await summary.innerText();

    await submitProfile(page, {
      age: "60",
      gender: "masculino",
      region: "Costa",
    });

    await expect
      .poll(async () => summary.innerText(), { timeout: QUOTE_BUDGET_MS })
      .not.toBe(firstSummary);
  });

  test("stays usable at 390x844 without horizontal scrolling", async ({ page }) => {
    await openQuoter(page);
    await submitProfile(page, {
      age: "35",
      gender: "femenino",
      region: "Austro",
    });
    await expect(quoteResults(page)).toBeVisible({ timeout: QUOTE_BUDGET_MS });

    const overflow = await page.evaluate(
      () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });

  test("rejects an out-of-range age with an accessible error", async ({ page }) => {
    await openQuoter(page);
    await page.getByLabel("Edad").fill("12");
    await page
      .getByRole("button", { name: /Ver mi plan|Actualizar cotización/ })
      .click();

    await expect(page.locator("#quote-error")).toContainText(/entre 18 y 99 años/);
    await expect(page.getByLabel("Edad")).toHaveAttribute("aria-invalid", "true");
  });
});
