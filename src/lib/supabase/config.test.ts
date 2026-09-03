import { describe, expect, it } from "vitest";
import { isSupabaseAuthConfigured, isSupabaseAdminConfigured } from "@/lib/supabase/config";
import {
  getSupabasePublicConfig,
  isSupabasePublicConfigComplete,
} from "@/lib/supabase/public-config";

describe("supabase config", () => {
  it("reports auth as unconfigured in test environment", () => {
    expect(isSupabaseAuthConfigured()).toBe(false);
  });

  it("reports admin as unconfigured in test environment", () => {
    expect(isSupabaseAdminConfigured()).toBe(false);
  });

  it("reads empty public config in test environment", () => {
    expect(getSupabasePublicConfig()).toEqual({ url: "", anonKey: "" });
    expect(isSupabasePublicConfigComplete(getSupabasePublicConfig())).toBe(
      false,
    );
  });
});
