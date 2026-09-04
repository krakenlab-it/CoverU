import { describe, expect, it } from "vitest";
import {
  BENTO_CARDS,
  HERO_SLIDES,
  MARKETING_FAQS,
  TESTIMONIALS,
} from "@/lib/marketing-content";
import { NAV_LINKS } from "@/lib/constants";
import { VISUAL_PACK_MARKETING } from "@/lib/visual-pack/assets";

const ENGLISH_LOREM_PATTERNS = [
  /content calendar/i,
  /linkedin brand manual/i,
  /lorem ipsum/i,
  /amet minim mollit/i,
];

const FAKE_METRIC_PATTERNS = [/\+10k/i, /30X/i, /45K/i, /nuestros usuarios/i];

describe("marketing content", () => {
  it("uses Astro-style header navigation labels", () => {
    expect(NAV_LINKS.map((link) => link.label)).toEqual([
      "Agentes",
      "Nosotros",
      "FAQs",
      "Contact",
    ]);
  });

  it("does not ship English lorem or fake metrics in marketing copy", () => {
    const allCopy = [
      ...HERO_SLIDES.flatMap((slide) => [
        slide.headline,
        slide.highlight,
        slide.subheadline,
      ]),
      ...BENTO_CARDS.flatMap((card) => [card.title, card.description]),
      ...MARKETING_FAQS.flatMap((faq) => [faq.question, faq.answer]),
      ...TESTIMONIALS.flatMap((item) => [item.name, item.role, item.quote]),
    ].join("\n");

    for (const pattern of [...ENGLISH_LOREM_PATTERNS, ...FAKE_METRIC_PATTERNS]) {
      expect(allCopy).not.toMatch(pattern);
    }
  });

  it("uses Sam visual pack paths for hero and bento cards", () => {
    expect(HERO_SLIDES[0].image).toBe(VISUAL_PACK_MARKETING.heroCoveru);
    expect(BENTO_CARDS.map((card) => card.id)).toEqual([
      "clarity",
      "compare",
      "trust",
    ]);
    expect(BENTO_CARDS[0].image).toBe(VISUAL_PACK_MARKETING.bentoClarity);
    expect(BENTO_CARDS[1].image).toBe(VISUAL_PACK_MARKETING.bentoCompare);
    expect(BENTO_CARDS[2].image).toBe(VISUAL_PACK_MARKETING.bentoTrust);
  });

  it("labels bento cards as Demo without insurer claims", () => {
    for (const card of BENTO_CARDS) {
      expect(card.description).toMatch(/Demo/i);
    }
  });

  it("uses honest testimonial placeholders instead of fake social proof", () => {
    for (const testimonial of TESTIMONIALS) {
      expect(testimonial.name).toMatch(/espacio para testimonio/i);
      expect(testimonial.quote).toMatch(/próximamente|recopilando/i);
    }
  });

  it("matches visual pack hero Spanish copy", () => {
    const hero = HERO_SLIDES[0];
    expect(hero.headline).toBe("Compara coberturas con claridad.");
    expect(hero.subheadline).toMatch(/experiencia Demo/i);
  });
});
