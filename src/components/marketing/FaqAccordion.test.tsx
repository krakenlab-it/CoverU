import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { MARKETING_FAQS } from "@/lib/marketing-content";

describe("FaqAccordion", () => {
  it("renders all FAQ questions", () => {
    render(<FaqAccordion items={MARKETING_FAQS} />);

    for (const faq of MARKETING_FAQS) {
      expect(screen.getByText(faq.question)).toBeInTheDocument();
    }
  });

  it("shows numbered prefixes when numbered is true", () => {
    render(<FaqAccordion items={MARKETING_FAQS.slice(0, 1)} numbered />);
    expect(screen.getByText("1.")).toBeInTheDocument();
  });
});
