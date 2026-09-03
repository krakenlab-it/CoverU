import { describe, expect, it } from "vitest";
import {
  buildCoveruEnvDiagnostics,
  buildCoveruEnvHealthResponse,
  classifyAnonKeyFromPrefix,
  classifyAnonKeyKind,
  getAnonKeyPrefix,
  getUrlHost,
} from "@/lib/supabase/env-diagnostics";

describe("env diagnostics", () => {
  it("extracts hostname from a valid Supabase URL", () => {
    expect(getUrlHost("https://abc123.supabase.co")).toBe("abc123.supabase.co");
    expect(getUrlHost("")).toBeNull();
    expect(getUrlHost("not-a-url")).toBeNull();
  });

  it("returns safe anon key prefix without leaking the full key", () => {
    const key = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.secret";
    expect(getAnonKeyPrefix(key)).toBe("eyJhbGci");
    expect(getAnonKeyPrefix("")).toBe("empty");
  });

  it("classifies anon key kinds", () => {
    expect(classifyAnonKeyKind("eyJhbGciOiJIUzI1NiJ9")).toBe("eyJ");
    expect(classifyAnonKeyKind("sb_publishable_abc123")).toBe("sb_publishable");
    expect(classifyAnonKeyKind("custom-key")).toBe("other");
    expect(classifyAnonKeyKind("")).toBe("empty");
  });

  it("classifies anon key kinds from prefix only", () => {
    expect(classifyAnonKeyFromPrefix("eyJhbGci")).toBe("eyJ");
    expect(classifyAnonKeyFromPrefix("sb_publi")).toBe("sb_publishable");
    expect(classifyAnonKeyFromPrefix("custom-k")).toBe("other");
    expect(classifyAnonKeyFromPrefix("empty")).toBe("empty");
  });

  it("builds diagnostics from explicit values without service role", () => {
    const diagnostics = buildCoveruEnvDiagnostics({
      route: "/login",
      url: "https://abc123.supabase.co",
      anonKey: "eyJhbGciOiJIUzI1NiJ9",
      includeServiceRole: false,
    });

    expect(diagnostics).toEqual({
      route: "/login",
      hasUrl: true,
      urlHost: "abc123.supabase.co",
      hasAnonKey: true,
      anonLength: 20,
      anonPrefix: "eyJhbGci",
      hasServiceRole: false,
    });
  });

  it("marks health as ok only when url and anon key are present", () => {
    const incomplete = buildCoveruEnvHealthResponse(
      buildCoveruEnvDiagnostics({
        url: "https://abc123.supabase.co",
        anonKey: "",
        includeServiceRole: false,
      }),
    );
    expect(incomplete.ok).toBe(false);

    const complete = buildCoveruEnvHealthResponse(
      buildCoveruEnvDiagnostics({
        url: "https://abc123.supabase.co",
        anonKey: "eyJhbGciOiJIUzI1NiJ9",
        includeServiceRole: false,
      }),
    );
    expect(complete.ok).toBe(true);
  });
});
