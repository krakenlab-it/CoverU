import Link from "next/link";
import { PageContainer } from "@/components/platform/PageContainer";
import { PageHeader } from "@/components/platform/PageHeader";
import { Button } from "@/components/ui/button";
import { buildPublicMetadata } from "@/lib/seo/metadata";

export const metadata = buildPublicMetadata({
  title: "Agentes",
  description:
    "Información para agentes y corredores de seguros interesados en CoverÜ en Ecuador.",
  path: "/agentes",
});

export default function AgentesPage() {
  return (
    <PageContainer size="narrow">
      <PageHeader title="Agentes" />
      <div className="mt-6 space-y-4 text-foreground/80">
        <p>
          CoverÜ está diseñado para que agentes y corredores de seguros puedan
          orientar a sus clientes con información clara y comparable. Buscamos
          partners que valoren la transparencia en la venta de planes de salud.
        </p>
        <p>
          Si eres agente o corredor y quieres conocer cómo participar cuando
          abramos la plataforma a productos reales, contáctanos.
        </p>
        <Button variant="brand" className="rounded-full" asChild>
          <Link href="/contacto">Contactar a CoverÜ</Link>
        </Button>
      </div>
    </PageContainer>
  );
}
