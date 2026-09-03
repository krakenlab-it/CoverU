import { describe, expect, it } from "vitest";
import {
  BENTO_CARDS,
  HERO_SLIDES,
  MARKETING_FAQS,
  TESTIMONIALS,
} from "@/lib/marketing-content";
import { NAV_LINKS } from "@/lib/constants";

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

  it("replaces template stats card with real product CTAs", () => {
    const easyCard = BENTO_CARDS.find((card) => card.id === "easy");
    expect(easyCard).toBeDefined();
    expect(easyCard && "secondaryCta" in easyCard && easyCard.secondaryCta).toEqual({
      label: "Iniciar sesión",
      href: "/login",
    });
    expect(easyCard?.cta).toEqual({ label: "Cotizar", href: "/comparar" });
  });

  it("uses honest testimonial placeholders instead of fake social proof", () => {
    for (const testimonial of TESTIMONIALS) {
      expect(testimonial.name).toMatch(/espacio para testimonio/i);
      expect(testimonial.quote).toMatch(/próximamente|recopilando/i);
    }
  });

  it("matches live Astro hero Spanish copy", () => {
    const saludSlide = HERO_SLIDES[0];
    expect(saludSlide.headline).toBe(
      "Encuentra el Seguro de Salud ideal y contrátalo",
    );
    expect(saludSlide.highlight).toBe("100% Online");
    expect(saludSlide.subheadline).toBe(
      "Te ayudamos a encontrar eso que realmente necesitas. ¡Sin letra chica, fácil y seguro!",
    );
    expect(HERO_SLIDES[1].headline).toBe("Seguros de empresa");
  });
});
