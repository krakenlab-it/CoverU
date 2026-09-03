import { describe, expect, it } from "vitest";
import { buildAppMetadata, buildPublicMetadata } from "@/lib/seo/metadata";
import { absoluteUrl, DEFAULT_TWITTER_IMAGE, pageTitle } from "@/lib/seo/site";

describe("SEO metadata helpers", () => {
  it("builds canonical public metadata with Open Graph", () => {
    const metadata = buildPublicMetadata({
      path: "/comparar",
      title: "Comparar planes",
      description: "Compara planes de salud en Ecuador.",
    });

    expect(metadata.alternates?.canonical).toBe(absoluteUrl("/comparar"));
    expect(metadata.robots).toEqual({ index: true, follow: true });
    expect(metadata.openGraph?.locale).toBe("es_EC");
    expect(metadata.twitter).toMatchObject({ card: "summary_large_image" });
    expect(metadata.twitter?.images).toEqual(
      expect.arrayContaining([
        absoluteUrl(DEFAULT_TWITTER_IMAGE),
        absoluteUrl("/og-coveru.png"),
      ]),
    );
  });

  it("blocks indexing for authenticated app routes", () => {
    const metadata = buildAppMetadata("Marketplace");
    expect(metadata.robots).toEqual({ index: false, follow: false });
  });

  it("formats page titles consistently", () => {
    expect(pageTitle("Comparar")).toBe("Comparar | CoverÜ");
    expect(pageTitle()).toContain("CoverÜ");
  });
});
