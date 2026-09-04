import AxeBuilder from "@axe-core/playwright";
import { test, expect } from "@playwright/test";
import { hasE2eAuth, loginAsTestUser } from "../helpers/auth";
import { DEMO_PLAN_VERSION_ID } from "../fixtures/demo";

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
  {
    name: "marketplace",
    path: "/app/marketplace?age=30&gender=femenino&region=Nacional",
    // Documented exception: persistent sidebar nav (PR #8) active link contrast — UI PR scope.
    disableRules: ["color-contrast"],
  },
  {
    name: "plan-detail",
    path: `/app/marketplace/plans/${DEMO_PLAN_VERSION_ID}`,
    disableRules: ["color-contrast"],
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

test.describe("accessibility — app pages (authenticated)", () => {
  test.beforeEach(async ({ page }, testInfo) => {
    if (!hasE2eAuth()) {
      testInfo.skip(true, "Requires E2E_TEST_USER_* and Supabase env");
      return;
    }
    await loginAsTestUser(page);
  });

  for (const target of APP_TARGETS) {
    test(`${target.name} has no serious WCAG violations`, async ({ page }) => {
      await runAxe(page, target);
    });
  }
});
