import { describe, expect, it } from "vitest";
import { motion } from "@/lib/motion";

describe("motion utilities", () => {
  it("uses motion-safe prefixes for transitions", () => {
    expect(motion.fadeIn).toContain("motion-safe:");
    expect(motion.cardHover).toContain("motion-safe:");
    expect(motion.panel).toContain("motion-safe:");
  });
});
