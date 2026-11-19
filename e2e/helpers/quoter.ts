import { expect, type Page } from "@playwright/test";

/** Mobile viewport required by the quoting flow acceptance criteria. */
export const MOBILE_VIEWPORT = { width: 390, height: 844 } as const;

/** Budget for reaching a quote from a cold page load. */
export const QUOTE_BUDGET_MS = 120_000;

export async function openQuoter(page: Page) {
  await page.goto("/comparar", { waitUntil: "domcontentloaded" });
  await expect(
    page.getByRole("heading", { level: 1, name: "Cotiza tu seguro de salud" }),
  ).toBeVisible();
}

export async function submitProfile(
  page: Page,
  profile: { age: string; gender: string; region: string },
) {
  await page.getByLabel("Edad").fill(profile.age);
  await page.getByLabel("Género").selectOption(profile.gender);
  await page.getByLabel("Región").selectOption(profile.region);
  await page.getByRole("button", { name: /Ver mi plan|Actualizar cotización/ }).click();
}

export function quoteResults(page: Page) {
  return page.getByRole("region", { name: "Resultados de cotización" });
}
