import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "FAQs",
  description: "Preguntas frecuentes sobre CoverÜ y el comparador de seguros.",
};

const FAQS = [
  {
    question: "¿Los precios son reales?",
    answer:
      "Por ahora mostramos datos de demostración marcados como DEMO. No son cotizaciones ni ofertas de aseguradoras reales hasta que integremos productos vigentes.",
  },
  {
    question: "¿Qué significa «tú pagas $X»?",
    answer:
      "Es la prima mensual estimada que pagarías según edad, género y región seleccionados, antes de copagos y deducible. En modo demo es un valor ilustrativo.",
  },
  {
    question: "¿CoverÜ vende seguros?",
    answer:
      "No. CoverÜ es un comparador informativo. Para contratar un plan debes contactar la aseguradora o un agente autorizado.",
  },
  {
    question: "¿Qué datos uso para comparar?",
    answer:
      "Edad, género y región. Estos criterios se usan comúnmente en tarifas de seguros de salud en Chile para segmentar precios.",
  },
  {
    question: "¿Cómo se guardan mis datos de contacto?",
    answer:
      "Si envías el formulario de contacto, guardamos nombre, email y mensaje en nuestra base de datos (Supabase) para responder tu consulta. No compartimos datos con terceros sin tu consentimiento.",
  },
];

export default function FaqsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-foreground">
        Preguntas frecuentes
      </h1>
      <dl className="mt-8 space-y-6">
        {FAQS.map((faq) => (
          <div
            key={faq.question}
            className="rounded-2xl border border-coveru-border p-6"
          >
            <dt className="font-semibold text-foreground">{faq.question}</dt>
            <dd className="mt-2 text-sm text-coveru-gray">{faq.answer}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
