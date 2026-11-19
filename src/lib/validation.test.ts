import { describe, expect, it } from "vitest";
import { leadSchema, compareQuerySchema, signupSchema } from "@/lib/validation";

describe("leadSchema", () => {
  it("accepts valid lead", () => {
    const result = leadSchema.safeParse({
      name: "María González",
      email: "maria@example.com",
      phone: "+56912345678",
      source: "contacto",
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid email", () => {
    const result = leadSchema.safeParse({
      name: "Test",
      email: "not-an-email",
    });
    expect(result.success).toBe(false);
  });

  it("rejects empty name", () => {
    const result = leadSchema.safeParse({
      name: "",
      email: "test@example.com",
    });
    expect(result.success).toBe(false);
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
