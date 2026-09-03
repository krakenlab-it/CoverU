import { FaqAccordion } from "@/components/marketing/FaqAccordion";
import { MARKETING_FAQS } from "@/lib/marketing-content";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "FAQs",
  description: "Preguntas frecuentes sobre Cover U y el comparador de seguros.",
  path: "/faqs",
});

const EXTENDED_FAQS = [
  ...MARKETING_FAQS,
  {
    question: "¿Cover U vende seguros?",
    answer:
      "No. Cover U es un comparador informativo. Para contratar un plan debes contactar la aseguradora o un agente autorizado.",
  },
  {
    question: "¿Cómo se guardan mis datos de contacto?",
    answer:
      "Si envías el formulario de contacto, guardamos nombre, correo y mensaje en nuestra base de datos para responder tu consulta. No compartimos datos con terceros sin tu consentimiento.",
  },
] as const;

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: EXTENDED_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

export default function FaqsPage() {
  return (
    <div className="marketing-layout py-10 md:py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <h1 className="marketing-h2 text-center">Preguntas frecuentes</h1>
      <div className="mx-auto mt-10 flex justify-center">
        <FaqAccordion items={EXTENDED_FAQS} numbered={false} />
      </div>
    </div>
  );
}
