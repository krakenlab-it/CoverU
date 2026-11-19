import { describe, expect, it } from "vitest";
import {
  compareQuerySchema,
  contactLeadSchema,
  leadQualificationSchema,
  leadSchema,
  quoterLeadSchema,
  signupSchema,
} from "@/lib/validation";

const contactLead = {
  intent: "contact" as const,
  name: "María González",
  email: "maria@example.com",
  phone: "+593 99 123 4567",
  message: "Quiero comparar planes para mi familia.",
  consent: true as const,
};

const quoterLead = {
  intent: "quote" as const,
  name: "María González",
  email: "maria@example.com",
  source: "cotizador",
  qualification: {
    age: 34,
    dependents: 2,
    city: "Quito",
    budget: 90,
    current_insurance: "Ninguno",
  },
  consent: true as const,
};

describe("contactLeadSchema", () => {
  it("accepts a consented contact lead", () => {
    const result = contactLeadSchema.safeParse(contactLead);
    expect(result.success).toBe(true);
  });

  it("rejects a lead without consent", () => {
    const result = contactLeadSchema.safeParse({
      ...contactLead,
      consent: false,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.path).toEqual(["consent"]);
    }
  });

  it("rejects a lead where consent is missing entirely", () => {
    const withoutConsent = { ...contactLead } as Record<string, unknown>;
    delete withoutConsent.consent;
    expect(contactLeadSchema.safeParse(withoutConsent).success).toBe(false);
  });

  it("rejects a truthy non-boolean consent value", () => {
    const result = contactLeadSchema.safeParse({ ...contactLead, consent: "si" });
    expect(result.success).toBe(false);
  });

  it("trims name and phone and turns a blank phone into undefined", () => {
    const result = contactLeadSchema.safeParse({
      ...contactLead,
      name: "  Ana  ",
      phone: "   ",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.name).toBe("Ana");
      expect(result.data.phone).toBeUndefined();
    }
  });

  it("rejects an invalid email and an empty name", () => {
    const badEmail = contactLeadSchema.safeParse({
      ...contactLead,
      email: "not-an-email",
    });
    const badName = contactLeadSchema.safeParse({ ...contactLead, name: "   " });

    expect(badEmail.success).toBe(false);
    expect(badName.success).toBe(false);
  });
});

describe("leadQualificationSchema", () => {
  it("coerces the strings a browser posts from text inputs", () => {
    const result = leadQualificationSchema.safeParse({
      age: "34",
      dependents: "2",
      city: " Quito ",
      budget: "90.50",
      current_insurance: " Saludsa ",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data).toEqual({
        age: 34,
        dependents: 2,
        city: "Quito",
        budget: 90.5,
        current_insurance: "Saludsa",
      });
    }
  });

  it("treats an empty budget and empty insurance as not declared", () => {
    const result = leadQualificationSchema.safeParse({
      age: "34",
      dependents: "0",
      city: "Cuenca",
      budget: "",
      current_insurance: "",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.budget).toBeUndefined();
      expect(result.data.current_insurance).toBeNull();
    }
  });

  it("accepts a zero budget instead of dropping it", () => {
    const result = leadQualificationSchema.safeParse({
      age: "34",
      dependents: "0",
      city: "Cuenca",
      budget: "0",
    });

    expect(result.success).toBe(true);
    if (result.success) expect(result.data.budget).toBe(0);
  });

  it("rejects a missing city", () => {
    const result = leadQualificationSchema.safeParse({
      age: "34",
      dependents: "0",
      city: "   ",
    });
    expect(result.success).toBe(false);
  });

  it("rejects an out-of-range age and dependents count", () => {
    for (const qualification of [
      { age: "17", dependents: "0", city: "Quito" },
      { age: "100", dependents: "0", city: "Quito" },
      { age: "34", dependents: "21", city: "Quito" },
      { age: "34", dependents: "-1", city: "Quito" },
    ]) {
      expect(leadQualificationSchema.safeParse(qualification).success).toBe(
        false,
      );
    }
  });

  it("rejects a negative budget and a non-numeric value", () => {
    expect(
      leadQualificationSchema.safeParse({
        age: "34",
        dependents: "0",
        city: "Quito",
        budget: "-1",
      }).success,
    ).toBe(false);

    expect(
      leadQualificationSchema.safeParse({
        age: "treinta",
        dependents: "0",
        city: "Quito",
      }).success,
    ).toBe(false);
  });
});

describe("quoterLeadSchema", () => {
  it("accepts a quote and an advisor lead with the qualification profile", () => {
    expect(quoterLeadSchema.safeParse(quoterLead).success).toBe(true);
    expect(
      quoterLeadSchema.safeParse({ ...quoterLead, intent: "advisor" }).success,
    ).toBe(true);
  });

  it("rejects a quoter lead without consent", () => {
    const result = quoterLeadSchema.safeParse({ ...quoterLead, consent: false });
    expect(result.success).toBe(false);
  });

  it("requires the qualification profile", () => {
    const withoutProfile = { ...quoterLead } as Record<string, unknown>;
    delete withoutProfile.qualification;
    const result = quoterLeadSchema.safeParse(withoutProfile);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(
        result.error.issues.some((issue) => issue.path[0] === "qualification"),
      ).toBe(true);
    }
  });

  it("keeps the contact intent out of the quoter schema", () => {
    const result = quoterLeadSchema.safeParse({ ...quoterLead, intent: "contact" });
    expect(result.success).toBe(false);
  });
});

describe("leadSchema", () => {
  it("discriminates contact from quoter payloads", () => {
    const contact = leadSchema.safeParse(contactLead);
    const quote = leadSchema.safeParse(quoterLead);

    expect(contact.success).toBe(true);
    expect(quote.success).toBe(true);
    if (contact.success) expect(contact.data.intent).toBe("contact");
    if (quote.success) expect(quote.data.intent).toBe("quote");
  });

  it("rejects an unknown intent", () => {
    expect(leadSchema.safeParse({ ...contactLead, intent: "newsletter" }).success).toBe(
      false,
    );
  });

  it("reports the qualification fields on their nested paths", () => {
    const result = leadSchema.safeParse({
      ...quoterLead,
      qualification: { age: "12", dependents: "0", city: "" },
    });

    expect(result.success).toBe(false);
    if (!result.success) {
      const paths = result.error.issues.map((issue) => issue.path.join("."));
      expect(paths).toContain("qualification.age");
      expect(paths).toContain("qualification.city");
    }
  });
});

describe("compareQuerySchema", () => {
  it("accepts an Ecuador profile", () => {
    const result = compareQuerySchema.safeParse({
      age: "30",
      gender: "femenino",
      region: "Sierra",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
      expect(result.data.region).toBe("Sierra");
    }
  });

  it("coerces numeric strings for age", () => {
    const result = compareQuerySchema.safeParse({
      age: "45",
      gender: "masculino",
      region: "Nacional",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.age).toBe(45);
  });

  it("rejects invalid gender", () => {
    const result = compareQuerySchema.safeParse({
      age: 30,
      gender: "other",
      region: "Nacional",
    });
    expect(result.success).toBe(false);
  });

  it("rejects the internal any gender", () => {
    const result = compareQuerySchema.safeParse({
      age: 30,
      gender: "any",
      region: "Nacional",
    });
    expect(result.success).toBe(false);
  });

  it("rejects Chile-era region slugs", () => {
    for (const region of ["metropolitana", "valparaiso", "biobio"]) {
      const result = compareQuerySchema.safeParse({
        age: 30,
        gender: "femenino",
        region,
      });
      expect(result.success).toBe(false);
    }
  });

  it("rejects ages outside 18–99", () => {
    for (const age of [17, 100, 30.5]) {
      const result = compareQuerySchema.safeParse({
        age,
        gender: "femenino",
        region: "Nacional",
      });
      expect(result.success).toBe(false);
    }
  });
});

describe("signupSchema", () => {
  it("accepts valid signup payload", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      organizationName: "Mi Org",
    });
    expect(result.success).toBe(true);
  });

  it("rejects short passwords", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "short",
      organizationName: "Mi Org",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty organization name", () => {
    const result = signupSchema.safeParse({
      email: "user@example.com",
      password: "password123",
      organizationName: "",
    });
    expect(result.success).toBe(false);
  });
});
