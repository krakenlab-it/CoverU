import { ComparisonGate } from "@/components/comparar/ComparisonGate";
import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "Comparar planes",
  description:
    "Compara planes de seguro de salud por edad, género y provincia en Ecuador. Datos de demostración.",
  path: "/comparar",
});

export default function CompararPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Comparar planes"
        description="Ingresa tu edad, género y provincia para ver planes de ejemplo con precios y coberturas transparentes."
        className="mb-8"
      />
      <ComparisonGate />
    </PageContainer>
  );
}
