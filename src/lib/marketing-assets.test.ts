import { describe, expect, it } from "vitest";
import { WHATSAPP_CONTACT_HREF } from "@/lib/constants";
import { MARKETING_ASSETS } from "@/lib/marketing-assets";

describe("marketing assets", () => {
  it("references Astro public filenames including dekstop typo", () => {
    expect(MARKETING_ASSETS.logotipo).toBe("/logotipo.png");
    expect(MARKETING_ASSETS.imagotipo).toBe("/imagotipo.png");
    expect(MARKETING_ASSETS.heroBackgroundDesktop).toBe(
      "/background-cover-dekstop.png",
    );
    expect(MARKETING_ASSETS.heroBackgroundMobile).toBe(
      "/background-cover-mobile.png",
    );
    expect(MARKETING_ASSETS.heroCoveru).toBe("/marketing/hero-coveru.png");
    expect(MARKETING_ASSETS.authHero).toBe("/marketing/auth-hero.png");
    expect(MARKETING_ASSETS.webAppManifestIcon512).toBe(
      "/web-app-manifest-512x512.png",
    );
    expect(MARKETING_ASSETS.siteWebManifest).toBe("/site.webmanifest");
  });

  it("uses WhatsApp for public contact CTAs", () => {
    expect(WHATSAPP_CONTACT_HREF).toMatch(/^https:\/\/wa\.me\//);
  });
});
