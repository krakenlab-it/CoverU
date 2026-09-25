import { expect, type Page } from "@playwright/test";

const PROTECTION_MARKERS = [
  /authentication required/i,
  /log in to vercel/i,
  /vercel authentication/i,
];

export async function gotoPreviewPath(page: Page, path: string) {
  // Do not wait for networkidle. Vercel preview keeps a connection open, and
  // that 30s wait used the entire test budget after the page had already rendered.
  await page.goto(path, { waitUntil: "domcontentloaded", timeout: 45_000 });

  const title = await page.title();
  const bodyText = await page.locator("body").innerText().catch(() => "");

  const blocked = PROTECTION_MARKERS.some(
    (pattern) => pattern.test(title) || pattern.test(bodyText),
  );

  expect(
    blocked,
    "Preview deployment appears behind Vercel protection — set VERCEL_AUTOMATION_BYPASS_SECRET in preview-verify workflow",
  ).toBe(false);
}

/**
 * Resilient landing assertions for Cover U marketing chrome.
 * Prefers role-based selectors over brittle hero carousel copy.
 */
export async function expectCoverULanding(page: Page) {
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await expect(
    page.getByRole("link", { name: /Quiero Asegurarme/i }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: "Iniciar sesión" }).first(),
  ).toBeVisible();

  await expect(
    page.getByRole("link", { name: /Cover U — inicio/i }).first(),
  ).toBeVisible();
}

export async function expectDevelopersDocs(page: Page) {
  await expect(page.getByText("API B2B v1")).toBeVisible();
  await expect(
    page.getByRole("heading", { level: 1, name: "Documentación para desarrolladores" }),
  ).toBeVisible();
}
