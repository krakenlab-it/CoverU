import { describe, expect, it } from "vitest";
import {
  groupApiEndpointsByTag,
  listApiEndpoints,
} from "@/lib/developers/openapi-reference";

describe("listApiEndpoints", () => {
  it("lists all HTTP operations from the OpenAPI spec", () => {
    const endpoints = listApiEndpoints();

    expect(endpoints.length).toBeGreaterThanOrEqual(6);
    expect(endpoints.some((endpoint) => endpoint.path === "/insurers")).toBe(
      true,
    );
    expect(endpoints.some((endpoint) => endpoint.path === "/coverage/qa")).toBe(
      true,
    );
    expect(endpoints.every((endpoint) => endpoint.fullPath.startsWith("/api/v1"))).toBe(
      true,
    );
  });

  it("groups endpoints by tag", () => {
    const grouped = groupApiEndpointsByTag(listApiEndpoints());

    expect(grouped.has("Catálogo")).toBe(true);
    expect(grouped.get("Cobertura")?.[0]?.method).toBe("POST");
  });
});
