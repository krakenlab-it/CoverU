import { describe, expect, it } from "vitest";
import { getPublicAuthNav } from "@/lib/auth/public-nav";

describe("getPublicAuthNav", () => {
  it("points anonymous visitors to login in demo mode", async () => {
    const nav = await getPublicAuthNav();
    expect(nav.isLoggedIn).toBe(false);
    expect(nav.href).toBe("/login");
    expect(nav.label).toBe("Iniciar sesión");
    expect(nav.isDemoMode).toBe(true);
  });
});
