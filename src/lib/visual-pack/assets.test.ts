import { describe, expect, it } from "vitest";
import { publicAssetExists } from "@/lib/brand/load-public-asset";
import { VISUAL_PACK_ICONS, VISUAL_PACK_MARKETING } from "@/lib/visual-pack/assets";

describe("visual pack assets (KLM-58)", () => {
  it("defines marketing hero and bento paths", () => {
    expect(VISUAL_PACK_MARKETING.heroCoveru).toBe("/marketing/hero-coveru.png");
    expect(VISUAL_PACK_MARKETING.authHero).toBe("/marketing/auth-hero.png");
    expect(VISUAL_PACK_MARKETING.bentoClarity).toBe("/marketing/bento-clarity.png");
    expect(VISUAL_PACK_MARKETING.bentoCompare).toBe("/marketing/bento-compare.png");
    expect(VISUAL_PACK_MARKETING.bentoTrust).toBe("/marketing/bento-trust.png");
  });

  it("defines assistant rail glyph and icon variants", () => {
    expect(VISUAL_PACK_ICONS.navAssistant).toBe("/nav-assistant.svg");
    expect(VISUAL_PACK_ICONS.assistant.png128).toBe("/icons/icon-assistant-128.png");
    expect(VISUAL_PACK_ICONS.spark.png64).toBe("/icons/icon-spark-64.png");
  });

  it("ships visual pack files under public/", () => {
    const required = [
      "marketing/hero-coveru.png",
      "marketing/auth-hero.png",
      "marketing/bento-clarity.png",
      "marketing/bento-compare.png",
      "marketing/bento-trust.png",
      "nav-assistant.svg",
      "icons/nav-assistant.png",
      "icons/icon-assistant-128.png",
      "icons/icon-assistant-64.png",
      "icons/icon-compare-128.png",
      "icons/icon-shield-64.png",
    ];

    for (const path of required) {
      expect(publicAssetExists(path)).toBe(true);
    }
  });
});
