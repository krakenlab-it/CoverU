import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/auth/safe-redirect";

describe("safeInternalPath", () => {
  it("keeps in-app paths", () => {
    expect(safeInternalPath("/app")).toBe("/app");
    expect(safeInternalPath("/app/marketplace?q=bmi")).toBe(
      "/app/marketplace?q=bmi",
    );
    expect(safeInternalPath("/actualizar-contrasena")).toBe(
      "/actualizar-contrasena",
    );
  });

  it("falls back when the value is missing", () => {
    expect(safeInternalPath(null)).toBe("/app");
    expect(safeInternalPath("")).toBe("/app");
    expect(safeInternalPath("   ")).toBe("/app");
  });

  it("rejects open redirects", () => {
    expect(safeInternalPath("https://evil.example/phish")).toBe("/app");
    expect(safeInternalPath("//evil.example")).toBe("/app");
    expect(safeInternalPath("/\\evil.example")).toBe("/app");
    expect(safeInternalPath("/\\\\evil.example")).toBe("/app");
    expect(safeInternalPath("javascript:alert(1)")).toBe("/app");
    expect(safeInternalPath("/app\nSet-Cookie: x")).toBe("/app");
  });
});
