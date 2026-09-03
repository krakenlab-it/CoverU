import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "Nosotros",
  description:
    "Conoce CoverÜ y nuestra misión de transparencia en seguros de salud en Ecuador.",
  path: "/nosotros",
});

export default function NosotrosPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader
        title="Nosotros"
        description="Transparencia y claridad en la comparación de seguros de salud."
      />
      <div className="mt-6 space-y-4 text-foreground/80">
        <p>
          CoverÜ nace con la misión de hacer más transparente la comparación de
          seguros de salud en Ecuador. Creemos que cada persona debe entender qué
          paga, qué cubre su plan y qué limitaciones tiene antes de contratar.
        </p>
        <p>
          Nuestro comparador muestra precios con la etiqueta &ldquo;tú pagas
          $X&rdquo;, deducibles, copagos, topes anuales y exclusiones de forma
          clara y expandible.
        </p>
        <p>
          En esta etapa inicial trabajamos con datos de demostración mientras
          integramos aseguradoras y tarifas reales. No publicamos precios ni
          promesas de cobertura que no podamos respaldar.
        </p>
      </div>
    </PageContainer>
  );
}
