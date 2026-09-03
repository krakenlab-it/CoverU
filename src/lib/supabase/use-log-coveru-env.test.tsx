import { renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";
import { useLogCoveruEnv } from "@/lib/supabase/use-log-coveru-env";

describe("useLogCoveruEnv", () => {
  it("logs once per distinct diagnostic payload", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const diagnostics = buildCoveruEnvDiagnostics({
      route: "/login",
      url: "",
      anonKey: "",
      includeServiceRole: false,
    });

    const { rerender } = renderHook(
      ({ enabled }) => useLogCoveruEnv(diagnostics, "warn", enabled),
      { initialProps: { enabled: true } },
    );

    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledWith(
      "[coveru-env]",
      expect.stringContaining('"route":"/login"'),
    );

    rerender({ enabled: true });
    expect(warnSpy).toHaveBeenCalledTimes(1);

    rerender({ enabled: false });
    expect(warnSpy).toHaveBeenCalledTimes(1);

    warnSpy.mockRestore();
  });
});
