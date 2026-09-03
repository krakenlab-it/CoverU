import { describe, expect, it } from "vitest";
import {
  BRAND_ASSETS,
  FAVICON_ASSETS,
  ILLUSTRATION_ASSETS,
  SOCIAL_ASSETS,
  brandLogoSrc,
  stateIllustrationSrc,
} from "@/lib/brand/assets";
import { publicAssetExists } from "@/lib/brand/load-public-asset";

describe("brand asset manifest", () => {
  it("defines drop-in paths under public/", () => {
    expect(BRAND_ASSETS.wordmark).toBe("/brand/wordmark.svg");
    expect(FAVICON_ASSETS.favicon).toBe("/favicon.ico");
    expect(SOCIAL_ASSETS.openGraph).toBe("/og-coveru.png");
    expect(ILLUSTRATION_ASSETS.empty).toBe("/illustrations/empty-state.svg");
  });

  it("resolves logo and illustration variants", () => {
    expect(brandLogoSrc("mark")).toBe(BRAND_ASSETS.mark);
    expect(stateIllustrationSrc("error")).toBe(ILLUSTRATION_ASSETS.error);
  });

  it("reports Sam pack is present on this checkout", () => {
    expect(publicAssetExists("brand/wordmark.svg")).toBe(true);
    expect(publicAssetExists("og-coveru.png")).toBe(true);
  });
});
