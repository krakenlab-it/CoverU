import Link from "next/link";
import { UsageChart } from "@/components/developers/UsageChart";
import { RequestLogsTable } from "@/components/settings/RequestLogsTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { ErrorState } from "@/components/platform/ErrorState";
import { PageHeader } from "@/components/platform/PageHeader";
import { SetupError } from "@/components/platform/SetupError";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardAnalytics } from "@/lib/dashboard/analytics";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildAppMetadata(
  "Panel",
  "Resumen de catálogo, uso de API y actividad reciente de tu organización.",
);

export default async function DashboardPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app");
  }

  const analytics = await getDashboardAnalytics(session.organizationId);

  if (analytics.error) {
    return <ErrorState message={analytics.error} />;
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <PageHeader
        title={`Hola, ${session.organizationName}`}
        description="Resumen del catálogo, uso de API y accesos rápidos a las herramientas principales."
      />

      {!analytics.serviceConfigured ? <SetupError compact /> : null}

      <section aria-labelledby="catalog-heading">
        <h2 id="catalog-heading" className="mb-4 text-lg font-semibold">
          Catálogo publicado
        </h2>
        <div className="grid gap-4 sm:grid-cols-3">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Aseguradoras activas</p>
              <p className="mt-1 text-3xl font-semibold">
                {analytics.catalog.insurers}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Planes publicados</p>
              <p className="mt-1 text-3xl font-semibold">
                {analytics.catalog.publishedPlans}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-muted-foreground">Tarifas activas</p>
              <p className="mt-1 text-3xl font-semibold">
                {analytics.catalog.tariffs}
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="usage-heading">
        <h2 id="usage-heading" className="mb-4 text-lg font-semibold">
          Uso de API
        </h2>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <Card>
            <CardContent className="grid gap-4 p-6">
              <div>
                <p className="text-sm text-muted-foreground">Últimas 24 horas</p>
                <p className="text-2xl font-semibold">
                  {analytics.usage24h.totalRequests}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Últimos 7 días</p>
                <p className="text-2xl font-semibold">
                  {analytics.usage7d.totalRequests}
                </p>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/app/desarrolladores/uso">Ver detalle de uso</Link>
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <UsageChart data={analytics.usageByDay} />
            </CardContent>
          </Card>
        </div>
      </section>

      <section aria-labelledby="shortcuts-heading">
        <h2 id="shortcuts-heading" className="mb-4 text-lg font-semibold">
          Accesos rápidos
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/app/marketplace">Explorar marketplace</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/desarrolladores/api-keys">Gestionar claves API</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/app/marketplace">Asistente de cobertura</Link>
          </Button>
        </div>
        <p className="mt-2 text-sm text-muted-foreground">
          El asistente de cobertura está disponible en el detalle de cada plan del
          marketplace.
        </p>
      </section>

      <section aria-labelledby="activity-heading">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
          <h2 id="activity-heading" className="text-lg font-semibold">
            Actividad reciente
          </h2>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/app/desarrolladores/registros">Ver todos los registros</Link>
          </Button>
        </div>

        {analytics.recentActivity.length === 0 ? (
          <EmptyState
            title="Sin actividad reciente"
            description={
              analytics.serviceConfigured
                ? "Las búsquedas en marketplace, consultas de cobertura y llamadas API aparecerán aquí."
                : "Configura Supabase para registrar y consultar la actividad de tu organización."
            }
          />
        ) : (
          <RequestLogsTable
            logs={analytics.recentActivity}
            showPlanColumn
            emptyMessage="Sin actividad en los últimos 7 días."
          />
        )}
      </section>

      {analytics.isEmpty && analytics.serviceConfigured ? (
        <EmptyState
          title="Tu panel está listo"
          description="Explora el marketplace o crea una clave API para empezar a integrar CoverÜ."
        />
      ) : null}
    </div>
  );
}
