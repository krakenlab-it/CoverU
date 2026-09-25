import { describe, expect, it } from "vitest";
import { formatUsd } from "@/lib/marketplace/format";

describe("formatUsd", () => {
  it("formats catalog premiums as US dollars with cents", () => {
    expect(formatUsd(4.34)).toMatch(/4,34/);
    expect(formatUsd(4.34)).not.toMatch(/CLP/);
    expect(formatUsd(4.34)).not.toBe("$4");
  });
});