import { describe, expect, it } from "vitest";
import {
  BMI_MARK_LOGO_URL,
  resolveInsurerLogoUrl,
  V13_INSURER_LOGO_URLS,
} from "@/lib/insurers/assets";

describe("insurer assets", () => {
  it("defines logo_url paths for all v1.3 carriers", () => {
    expect(V13_INSURER_LOGO_URLS.bmi).toBe("/insurers/bmi.png");
    expect(V13_INSURER_LOGO_URLS.confiamed).toBe("/insurers/confiamed.png");
    expect(V13_INSURER_LOGO_URLS.saludsa).toBe("/insurers/saludsa.svg");
  });

  it("uses square BMI mark only for compact slots", () => {
    expect(
      resolveInsurerLogoUrl({ slug: "bmi", logo_url: "/insurers/bmi.png" }, { square: true }),
    ).toBe(BMI_MARK_LOGO_URL);

    expect(
      resolveInsurerLogoUrl({ slug: "confiamed", logo_url: "/insurers/confiamed.png" }, { square: true }),
    ).toBe("/insurers/confiamed.png");
  });
});
