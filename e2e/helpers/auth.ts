import { expect, type Page } from "@playwright/test";

/** True when Supabase public env vars are set (auth may still need E2E user secrets). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

/** True when CI/local has a staging Supabase project and dedicated E2E user. */
export function hasE2eAuth(): boolean {
  return Boolean(
    process.env.E2E_TEST_USER_EMAIL &&
      process.env.E2E_TEST_USER_PASSWORD &&
      isSupabaseConfigured(),
  );
}

export async function loginAsTestUser(page: Page, redirect = "/app") {
  const email = process.env.E2E_TEST_USER_EMAIL;
  const password = process.env.E2E_TEST_USER_PASSWORD;

  if (!email || !password) {
    throw new Error("E2E_TEST_USER_EMAIL and E2E_TEST_USER_PASSWORD are required");
  }

  await page.goto(`/login?redirect=${encodeURIComponent(redirect)}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Contraseña").fill(password);
  await page.getByRole("button", { name: "Iniciar sesión" }).click();
  await expect(page).toHaveURL(new RegExp(redirect.replace(/\//g, "\\/")));
}
