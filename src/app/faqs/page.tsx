import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "FAQs",
  description: "Preguntas frecuentes sobre CoverÜ y el comparador de seguros en Ecuador.",
  path: "/faqs",
});

const FAQS = [
  {
    question: "¿Los precios son reales?",
    answer:
      "Por ahora mostramos datos de demostración marcados como DEMO. No son cotizaciones ni ofertas de aseguradoras reales hasta que integremos productos vigentes.",
  },
  {
    question: "¿Qué significa «tú pagas $X»?",
    answer:
      "Es la prima mensual estimada que pagarías según edad, género y provincia seleccionados, antes de copagos y deducible. En modo demo es un valor ilustrativo.",
  },
  {
    question: "¿CoverÜ vende seguros?",
    answer:
      "No. CoverÜ es un comparador informativo. Para contratar un plan debes contactar la aseguradora o un agente autorizado.",
  },
  {
    question: "¿Qué datos uso para comparar?",
    answer:
      "Edad, género y provincia. Estos criterios se usan comúnmente en tarifas de seguros de salud para segmentar precios.",
  },
  {
    question: "¿Cómo se guardan mis datos de contacto?",
    answer:
      "Si envías el formulario de contacto, guardamos nombre, email y mensaje en nuestra base de datos (Supabase) para responder tu consulta. No compartimos datos con terceros sin tu consentimiento.",
  },
];

const faqStructuredData = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((faq) => ({
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
    <PageContainer size="narrow">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
      />
      <PageHeader title="Preguntas frecuentes" />
      <dl className="mt-8 space-y-4">
        {FAQS.map((faq) => (
          <Card key={faq.question}>
            <CardContent className="p-6">
              <dt className="font-semibold text-foreground">{faq.question}</dt>
              <dd className="mt-2 text-sm text-muted-foreground">{faq.answer}</dd>
            </CardContent>
          </Card>
        ))}
      </dl>
    </PageContainer>
  );
}
