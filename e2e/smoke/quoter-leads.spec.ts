import { expect, test } from "@playwright/test";
import {
  MOBILE_VIEWPORT,
  QUOTE_BUDGET_MS,
  acceptLeadConsent,
  fillLeadForm,
  leadForm,
  openQuoter,
  quoteResults,
  submitLeadAction,
  submitProfile,
} from "../helpers/quoter";

test.use({ viewport: MOBILE_VIEWPORT, isMobile: true, hasTouch: true });

async function quoteAs(page: import("@playwright/test").Page, age = "34") {
  await openQuoter(page);
  await submitProfile(page, {
    age,
    gender: "femenino",
    region: "Sierra",
  });
  await expect(quoteResults(page)).toBeVisible({ timeout: QUOTE_BUDGET_MS });
  await expect(leadForm(page)).toBeVisible({ timeout: QUOTE_BUDGET_MS });
}

test.describe("quoter lead capture — mobile 390x844", () => {
  test("captures the qualification fields and confirms a quote lead", async ({
    page,
  }) => {
    await quoteAs(page);

    const form = leadForm(page);
    for (const label of [
      "Nombre",
      "Email",
      "Teléfono (opcional)",
      "Dependientes",
      "Ciudad",
      "Presupuesto mensual (USD, opcional)",
      "Seguro actual (opcional)",
    ]) {
      await expect(form.getByLabel(label)).toBeVisible();
    }

    await fillLeadForm(page, {
      name: "Ana Pérez",
      email: "ana@example.com",
      dependents: "2",
      city: "Quito",
      budget: "90",
      currentInsurance: "Ninguno",
    });
    await acceptLeadConsent(page);
    await submitLeadAction(page, "quote");

    await expect(
      page.getByText("Guardamos tus datos para dar seguimiento a tu cotización."),
    ).toBeVisible();
  });

  test("'Hablar con un asesor' flags the lead for human follow-up", async ({
    page,
  }) => {
    await quoteAs(page);

    await fillLeadForm(page, {
      name: "Luis Vera",
      email: "luis@example.com",
      dependents: "1",
      city: "Guayaquil",
    });
    await acceptLeadConsent(page);

    const request = page.waitForRequest(
      (candidate) =>
        candidate.url().endsWith("/api/leads") &&
        candidate.method() === "POST",
    );
    const response = page.waitForResponse((candidate) =>
      candidate.url().endsWith("/api/leads"),
    );

    await submitLeadAction(page, "advisor");

    const payload = (await request).postDataJSON() as Record<string, unknown>;
    expect(payload.intent).toBe("advisor");
    expect(payload.consent).toBe(true);
    // The browser never decides the queue flag; the API derives it.
    expect(payload).not.toHaveProperty("needs_human_followup");

    const body = (await (await response).json()) as {
      needs_human_followup?: boolean;
    };
    expect(body.needs_human_followup).toBe(true);

    await expect(
      page.getByText("Un asesor te contactará para revisar tu cotización."),
    ).toBeVisible();
  });

  test("the consent gate blocks a lead without consent", async ({ page }) => {
    await quoteAs(page);
    await fillLeadForm(page, {
      name: "Ana Pérez",
      email: "ana@example.com",
      city: "Cuenca",
    });

    let posted = false;
    page.on("request", (request) => {
      if (request.url().endsWith("/api/leads")) posted = true;
    });

    await submitLeadAction(page, "advisor");

    await expect(page.getByText(/Necesitamos tu consentimiento/)).toBeVisible();
    expect(posted).toBe(false);
    await expect(leadForm(page)).toBeVisible();
  });

  test("requires a city before submitting", async ({ page }) => {
    await quoteAs(page);
    await fillLeadForm(page, {
      name: "Ana Pérez",
      email: "ana@example.com",
    });
    await acceptLeadConsent(page);
    await submitLeadAction(page, "quote");

    await expect(page.getByText("Ciudad requerida")).toBeVisible();
  });

  test("stays usable at 390x844 without horizontal scrolling", async ({ page }) => {
    await quoteAs(page);
    await expect(leadForm(page)).toBeVisible();

    const overflow = await page.evaluate(
      () =>
        document.documentElement.scrollWidth -
        document.documentElement.clientWidth,
    );
    expect(overflow).toBeLessThanOrEqual(1);
  });
});
