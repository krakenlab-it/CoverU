import { describe, expect, it } from "vitest";
import {
  HUMAN_FOLLOWUP_INTENT,
  LEAD_CONSENT_LABEL,
  LEAD_CONSENT_VERSION,
  LEAD_INTENTS,
  needsHumanFollowup,
} from "@/lib/leads/consent";

describe("lead consent contract", () => {
  it("exposes the three supported lead intents", () => {
    expect(LEAD_INTENTS).toEqual(["contact", "quote", "advisor"]);
  });

  it("only flags advisor leads for human follow-up", () => {
    expect(needsHumanFollowup("advisor")).toBe(true);
    expect(needsHumanFollowup("quote")).toBe(false);
    expect(needsHumanFollowup("contact")).toBe(false);
    expect(HUMAN_FOLLOWUP_INTENT).toBe("advisor");
  });

  it("ships a non-empty versioned consent label", () => {
    expect(LEAD_CONSENT_VERSION.length).toBeGreaterThan(0);
    expect(LEAD_CONSENT_LABEL.length).toBeGreaterThan(0);
  });

  it("does not claim legal compliance in placeholder copy", () => {
    expect(LEAD_CONSENT_LABEL).not.toMatch(/lopdp|ley orgánica|normativa/i);
  });
});
