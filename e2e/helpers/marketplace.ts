import { type Page } from "@playwright/test";

/** Radix Select controls are not native <select>; open then pick an option. */
export async function selectRadixOption(
  page: Page,
  label: string,
  optionName: string,
) {
  await page.getByLabel(label).click();
  await page.getByRole("option", { name: optionName }).click();
}

export async function openCoverageAssistant(page: Page) {
  const rail = page.getByRole("region", { name: "Asistente de cobertura" });
  if (await rail.isVisible().catch(() => false)) {
    return;
  }

  const openButton = page.getByRole("button", {
    name: /Abrir asistente( de cobertura)?/i,
  });
  await openButton.first().click();
  await rail.waitFor({ state: "visible" });
}
