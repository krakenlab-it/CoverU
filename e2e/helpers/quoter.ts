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

/** Lead capture card rendered under the quote results. */
export function leadForm(page: Page) {
  return page.getByRole("form", { name: "Datos de contacto" });
}

export interface LeadFormValues {
  name: string;
  email: string;
  phone?: string;
  dependents?: string;
  /** Omit to leave the city blank and exercise the required-field error. */
  city?: string;
  budget?: string;
  currentInsurance?: string;
}

export async function fillLeadForm(page: Page, values: LeadFormValues) {
  const form = leadForm(page);
  await form.getByLabel("Nombre").fill(values.name);
  await form.getByLabel("Email").fill(values.email);
  if (values.phone !== undefined) {
    await form.getByLabel("Teléfono (opcional)").fill(values.phone);
  }
  if (values.dependents !== undefined) {
    await form.getByLabel("Dependientes").fill(values.dependents);
  }
  if (values.city !== undefined) {
    await form.getByLabel("Ciudad").fill(values.city);
  }
  if (values.budget !== undefined) {
    await form.getByLabel("Presupuesto mensual (USD, opcional)").fill(values.budget);
  }
  if (values.currentInsurance !== undefined) {
    await form.getByLabel("Seguro actual (opcional)").fill(values.currentInsurance);
  }
}

export async function acceptLeadConsent(page: Page) {
  await page.getByRole("checkbox", { name: /Acepto que CoverÜ/ }).click();
}

/** `quote` = "Enviar mis datos", `advisor` = "Hablar con un asesor". */
export async function submitLeadAction(page: Page, action: "quote" | "advisor") {
  const label = action === "advisor" ? "Hablar con un asesor" : "Enviar mis datos";
  await page.getByRole("button", { name: label }).click();
}
