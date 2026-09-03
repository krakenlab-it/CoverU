import { MARKETING_FAQS } from "@/lib/marketing-content";
import { FaqAccordion } from "@/components/marketing/FaqAccordion";

export function FaqSection() {
  return (
    <section className="py-12 md:py-24" aria-labelledby="faq-heading">
      <div className="marketing-layout flex flex-col items-center gap-10">
        <h2 id="faq-heading" className="marketing-h2 text-center">
          Preguntas frecuentes
        </h2>
        <FaqAccordion items={MARKETING_FAQS} />
      </div>
    </section>
  );
}
