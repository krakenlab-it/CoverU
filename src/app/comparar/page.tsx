import { ComparisonGate } from "@/components/comparar/ComparisonGate";
import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { getPublicQuote } from "@/lib/quoters/public-quote";
import type { QuoteRequest } from "@/lib/quoters/types";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "Cotiza tu seguro de salud",
  description:
    "Cotiza en menos de dos minutos tu seguro de salud en Ecuador con las tarifas reales de Saludsa, Confiamed y BMI.",
  path: "/comparar",
});

// Tariffs must come from the live catalog, never a build-time snapshot.
export const dynamic = "force-dynamic";

const DEFAULT_REQUEST: QuoteRequest = {
  age: 30,
  gender: "femenino",
  region: "Nacional",
};

export default async function CompararPage() {
  const initialQuote = await getPublicQuote(DEFAULT_REQUEST);

  return (
    <PageContainer>
      <PageHeader
        eyebrow="Cotizador"
        title="Cotiza tu seguro de salud"
        description="Ingresa tu edad, género y región para ver la prima mensual de cada plan. Toma menos de dos minutos."
        className="mb-6 sm:mb-8"
      />
      <ComparisonGate initialQuote={initialQuote} />
    </PageContainer>
  );
}
