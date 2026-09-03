import { readFileSync, readdirSync } from "fs";
import { join } from "path";
import { describe, expect, it } from "vitest";

const MIGRATIONS_DIR = join(process.cwd(), "supabase/migrations");
const UUID_REGEX =
  /['"]([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})['"]/gi;

describe("supabase migrations", () => {
  const files = readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith(".sql"))
    .sort();

  it("includes phase 1 migration files", () => {
    expect(files).toContain("20250102000000_phase1_schema.sql");
    expect(files).toContain("20250102000001_phase1_seed_demo.sql");
    expect(files).toContain("20250103000000_organization_settings.sql");
  });

  for (const file of files) {
    it(`${file} uses valid UUIDs in fixtures`, () => {
      const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
      const matches = [...content.matchAll(UUID_REGEX)].map((m) => m[1]);
      for (const uuid of matches) {
        expect(uuid).toMatch(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i,
        );
      }
    });

    it(`${file} marks demo data explicitly`, () => {
      if (!file.includes("seed")) return;
      const content = readFileSync(join(MIGRATIONS_DIR, file), "utf-8");
      expect(content).toMatch(/is_demo\s*=\s*true|\[DEMO\]/);
    });
  }

  it("phase1 schema enables RLS on tenant tables", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, "20250102000000_phase1_schema.sql"),
      "utf-8",
    );
    expect(content).toContain("ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("organizations");
    expect(content).toContain("api_keys");
    expect(content).toContain("plan_versions_published_read");
  });

  it("organization settings migration enables RLS", () => {
    const content = readFileSync(
      join(MIGRATIONS_DIR, "20250103000000_organization_settings.sql"),
      "utf-8",
    );
    expect(content).toContain("organization_settings");
    expect(content).toContain("ENABLE ROW LEVEL SECURITY");
    expect(content).toContain("org_settings_admin_update");
  });
});
