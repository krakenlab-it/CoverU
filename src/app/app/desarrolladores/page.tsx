import Link from "next/link";
import { UsageChart } from "@/components/developers/UsageChart";
import { EmptyState } from "@/components/platform/EmptyState";
import { SetupError } from "@/components/platform/SetupError";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardAnalytics } from "@/lib/dashboard/analytics";
import { listApiEndpoints } from "@/lib/developers/openapi-reference";
import { listOrgApiKeys } from "@/lib/settings/api-keys";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildAppMetadata(
  "Desarrolladores — Resumen",
  "Resumen de claves API y uso de tu organización.",
);

export default async function DesarrolladoresHubPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/desarrolladores");
  }

  const [analytics, { keys, serviceConfigured }] = await Promise.all([
    getDashboardAnalytics(session.organizationId),
    listOrgApiKeys(session.organizationId),
  ]);

  const activeKeys = keys.filter((key) => key.status === "active");
  const apiEndpoints = listApiEndpoints().slice(0, 4);

  return (
    <div className="space-y-6">
      {!serviceConfigured ? <SetupError compact /> : null}

      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Claves activas</p>
            <p className="mt-1 text-3xl font-semibold">{activeKeys.length}</p>
            <Button variant="link" className="mt-2 h-auto p-0" asChild>
              <Link href="/app/desarrolladores/api-keys">Administrar claves</Link>
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Solicitudes (24 h)</p>
            <p className="mt-1 text-3xl font-semibold">
              {analytics.usage24h.totalRequests}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-muted-foreground">Solicitudes (7 días)</p>
            <p className="mt-1 text-3xl font-semibold">
              {analytics.usage7d.totalRequests}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="p-6">
          <UsageChart data={analytics.usageByDay} />
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-semibold">Documentación de la API</h2>
            <Button size="sm" asChild>
              <Link href="/app/desarrolladores/docs">Ver documentación</Link>
            </Button>
          </div>
          <p className="text-sm text-muted-foreground">
            Autenticación con <code>X-API-Key</code> o Bearer, referencia de
            endpoints, ejemplos curl y límites de tasa — todo dentro del panel.
          </p>
          <ul className="space-y-2 text-sm">
            {apiEndpoints.map((endpoint) => (
              <li
                key={`${endpoint.method}-${endpoint.path}`}
                className="flex flex-wrap items-center gap-2"
              >
                <Badge variant="secondary">{endpoint.method}</Badge>
                <span className="font-mono text-xs text-muted-foreground">
                  {endpoint.fullPath}
                </span>
                <span className="text-muted-foreground">{endpoint.summary}</span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {activeKeys.length === 0 && serviceConfigured ? (
        <EmptyState
          title="Sin claves API activas"
          description="Crea una clave para empezar a consumir la API B2B de CoverÜ."
          actionLabel="Crear clave API"
          actionHref="/app/desarrolladores/api-keys"
        />
      ) : null}
    </div>
  );
}
