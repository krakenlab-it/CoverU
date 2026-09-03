import { describe, expect, it } from "vitest";
import { AUTH_MARKETING_ROUTES, isAuthMarketingRoute } from "@/lib/auth/auth-routes";

describe("auth marketing routes", () => {
  it("lists public auth pages", () => {
    expect(AUTH_MARKETING_ROUTES).toContain("/login");
    expect(AUTH_MARKETING_ROUTES).toContain("/registro");
    expect(AUTH_MARKETING_ROUTES).toContain("/recuperar");
    expect(AUTH_MARKETING_ROUTES).toContain("/actualizar-contrasena");
  });

  it("detects auth marketing routes", () => {
    expect(isAuthMarketingRoute("/login")).toBe(true);
    expect(isAuthMarketingRoute("/registro")).toBe(true);
    expect(isAuthMarketingRoute("/recuperar")).toBe(true);
    expect(isAuthMarketingRoute("/actualizar-contrasena")).toBe(true);
    expect(isAuthMarketingRoute("/app")).toBe(false);
    expect(isAuthMarketingRoute("/")).toBe(false);
  });
});
