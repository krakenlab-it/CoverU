import { describe, expect, it } from "vitest";
import { isSupabaseAuthConfigured, isSupabaseAdminConfigured } from "@/lib/supabase/config";

describe("supabase config", () => {
  it("reports auth as unconfigured in test environment", () => {
    expect(isSupabaseAuthConfigured()).toBe(false);
  });

  it("reports admin as unconfigured in test environment", () => {
    expect(isSupabaseAdminConfigured()).toBe(false);
  });
});
