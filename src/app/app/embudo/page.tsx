import { FunnelChart, FunnelDayTable } from "@/components/dashboard/FunnelChart";
import { EmptyState } from "@/components/platform/EmptyState";
import { ErrorState } from "@/components/platform/ErrorState";
import { PageHeader } from "@/components/platform/PageHeader";
import { SetupError } from "@/components/platform/SetupError";
import { Card, CardContent } from "@/components/ui/card";
import { getFunnelSummary } from "@/lib/dashboard/funnel";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildAppMetadata(
  "Embudo",
  "Conteo de leads, cotizaciones y solicitudes de asesor en tu organización.",
);

export default async function FunnelPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/embudo");
  }

  const summary = await getFunnelSummary(session.organizationId);

  if (summary.error) {
    return <ErrorState message={summary.error} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        eyebrow="Analítica"
        title="Embudo de conversión"
        description={`Eventos registrados en los últimos ${summary.windowDays} días: lead capturado, cotización y solicitud de asesor.`}
      />

      {!summary.serviceConfigured ? <SetupError compact /> : null}

      <section aria-labelledby="funnel-counts-heading">
        <h2 id="funnel-counts-heading" className="mb-4 text-lg font-semibold">
          Conteo por paso
        </h2>
        {summary.isEmpty && summary.serviceConfigured ? (
          <EmptyState
            title="Sin eventos del embudo"
            description="Cuando alguien pida una cotización o deje sus datos, los pasos aparecerán aquí."
          />
        ) : (
          <Card>
            <CardContent className="p-6">
              <FunnelChart summary={summary} />
            </CardContent>
          </Card>
        )}
      </section>

      {!summary.isEmpty ? (
        <section aria-labelledby="funnel-days-heading">
          <h2 id="funnel-days-heading" className="mb-4 text-lg font-semibold">
            Detalle por día
          </h2>
          <FunnelDayTable summary={summary} />
        </section>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Los eventos guardan solo el paso, la superficie de origen y el conteo de
        planes cotizados. Nunca incluyen datos de salud.
      </p>
    </div>
  );
}
