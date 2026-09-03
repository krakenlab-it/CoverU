import { describe, expect, it } from "vitest";
import { leadSchema, compareQuerySchema } from "@/lib/validation";

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
  it("accepts valid compare params", () => {
    const result = compareQuerySchema.safeParse({
      age: "30",
      gender: "femenino",
      region: "metropolitana",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.age).toBe(30);
    }
  });

  it("rejects invalid gender", () => {
    const result = compareQuerySchema.safeParse({
      age: 30,
      gender: "other",
      region: "metropolitana",
    });
    expect(result.success).toBe(false);
  });
});
