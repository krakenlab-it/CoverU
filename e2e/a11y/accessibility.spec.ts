import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";

interface A11yTarget {
  name: string;
  path: string;
  /** axe rule IDs to disable for this page only (documented exceptions). */
  disableRules?: string[];
}

const PUBLIC_TARGETS: A11yTarget[] = [
  { name: "landing", path: "/" },
  { name: "comparator", path: "/comparar" },
  {
    name: "developers",
    path: "/developers",
    // Documented exceptions: inline openapi link in gray paragraph (UI PR),
    // and horizontal code `<pre>` scroll regions without tabindex (dev docs only).
    disableRules: ["link-in-text-block", "scrollable-region-focusable"],
  },
  { name: "login", path: "/login" },
];

const APP_TARGETS: A11yTarget[] = [
  { name: "marketplace", path: "/app/marketplace?age=30&gender=femenino&region=metropolitana" },
  {
    name: "plan-detail",
    path: "/app/marketplace/plans/d1000000-0000-4000-8000-000000000001",
  },
];

async function runAxe(
  page: import("@playwright/test").Page,
  target: A11yTarget,
) {
  await page.goto(target.path);
  await page.waitForLoadState("networkidle");

  let builder = new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa"]);

  if (target.disableRules?.length) {
    builder = builder.disableRules(target.disableRules);
  }

  const results = await builder.analyze();
  expect(
    results.violations,
    `${target.name} a11y violations: ${JSON.stringify(results.violations, null, 2)}`,
  ).toEqual([]);
}

test.describe("accessibility — public pages", () => {
  for (const target of PUBLIC_TARGETS) {
    test(`${target.name} has no serious WCAG violations`, async ({ page }) => {
      await runAxe(page, target);
    });
  }
});

test.describe("accessibility — app pages (demo mode)", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("button", { name: "Entrar al panel demo" }).click();
    await expect(page).toHaveURL(/\/app/);
  });

  for (const target of APP_TARGETS) {
    test(`${target.name} has no serious WCAG violations`, async ({ page }) => {
      await runAxe(page, target);
    });
  }
});
