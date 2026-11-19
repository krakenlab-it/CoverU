import { describe, expect, it } from "vitest";
import { getBundledCatalogDomain } from "@/lib/catalog/package";
import { buildQuotesFromCatalog } from "@/lib/quoters/quote";

/**
 * Runs the quoter against the real v1.3 package committed in `data/catalog`,
 * which is the same source the page uses when Supabase is unconfigured.
 */
describe("public quoter on the bundled v1.3 catalog", () => {
  const domain = getBundledCatalogDomain();

  it("loads the three v1.3 insurers", () => {
    expect(domain).not.toBeNull();
    const names = (domain?.insurers ?? []).map((insurer) => insurer.name).sort();
    expect(names).toEqual(["BMI", "Confiamed", "Saludsa"]);
  });

  it("loads the full plan and tariff matrix", () => {
    expect(domain?.plans).toHaveLength(141);
    expect(domain?.tariffs).toHaveLength(6137);
  });

  it("quotes all three insurers for an adult profile", () => {
    const result = buildQuotesFromCatalog(
      domain!,
      { age: 30, gender: "femenino", region: "Sierra" },
      "bundled-catalog",
    );

    const insurers = new Set(result.offers.map((offer) => offer.insurerName));
    expect(insurers).toEqual(new Set(["BMI", "Confiamed", "Saludsa"]));
    expect(result.totalOffers).toBe(result.offers.length);
    expect(result.offers.length).toBeGreaterThan(30);
  });

  it("returns offers sorted by monthly price", () => {
    const result = buildQuotesFromCatalog(
      domain!,
      { age: 45, gender: "masculino", region: "Costa" },
      "bundled-catalog",
    );

    const prices = result.offers.map((offer) => offer.monthlyPrice);
    expect(prices).toEqual([...prices].sort((a, b) => a - b));
    expect(prices[0]).toBeGreaterThan(0);
  });

  it("never quotes a demo row from the real package", () => {
    const result = buildQuotesFromCatalog(
      domain!,
      { age: 60, gender: "masculino", region: "Nacional" },
      "bundled-catalog",
    );

    expect(result.offers.every((offer) => offer.isDemo === false)).toBe(true);
  });

  it("prices Sierra differently from the national matrix where BMI is regional", () => {
    const sierra = buildQuotesFromCatalog(
      domain!,
      { age: 30, gender: "femenino", region: "Sierra" },
      "bundled-catalog",
    );
    const nacional = buildQuotesFromCatalog(
      domain!,
      { age: 30, gender: "femenino", region: "Nacional" },
      "bundled-catalog",
    );

    const bmiSierra = sierra.offers.filter((offer) => offer.insurerName === "BMI");
    const bmiNacional = nacional.offers.filter((offer) => offer.insurerName === "BMI");

    expect(bmiSierra.length).toBeGreaterThan(0);
    expect(bmiSierra.every((offer) => offer.region === "Sierra")).toBe(true);
    expect(bmiNacional).toHaveLength(0);
  });

  it("returns no offers for an age the matrix does not cover", () => {
    const result = buildQuotesFromCatalog(
      domain!,
      { age: 17, gender: "femenino", region: "Nacional" },
      "bundled-catalog",
    );

    expect(result.offers).toHaveLength(0);
  });
});

describe("getPublicQuote source resolution", () => {
  it("serves the bundled package when Supabase is unconfigured", async () => {
    const { getPublicQuote } = await import("@/lib/quoters/public-quote");
    const result = await getPublicQuote({
      age: 30,
      gender: "femenino",
      region: "Sierra",
    });

    expect(result).not.toBeNull();
    expect(result?.source).toBe("bundled-catalog");
    expect(result?.offers.length).toBeGreaterThan(0);
  });
});
