import { describe, expect, it } from "vitest";
import robots from "@/app/robots";
import sitemap from "@/app/sitemap";

describe("SEO route handlers", () => {
  it("disallows app and api routes in robots.txt", () => {
    const config = robots();
    const rules = Array.isArray(config.rules) ? config.rules : [config.rules];
    const rule = rules[0];
    expect(rule?.disallow).toEqual(expect.arrayContaining(["/app/", "/api/"]));
    expect(config.sitemap).toContain("sitemap.xml");
  });

  it("includes only public routes in sitemap", () => {
    const entries = sitemap();
    const urls = entries.map((e) => e.url);
    expect(urls.some((u) => u.endsWith("/comparar"))).toBe(true);
    expect(urls.some((u) => u.includes("/app/"))).toBe(false);
  });
});
