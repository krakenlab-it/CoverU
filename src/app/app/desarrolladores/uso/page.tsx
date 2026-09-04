import { UsageChart } from "@/components/developers/UsageChart";
import { EmptyState } from "@/components/platform/EmptyState";
import { ErrorState } from "@/components/platform/ErrorState";
import { SetupError } from "@/components/platform/SetupError";
import { Card, CardContent } from "@/components/ui/card";
import { getDashboardAnalytics } from "@/lib/dashboard/analytics";
import { getOrgUsageSummary } from "@/lib/settings/usage";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildAppMetadata(
  "Uso de API",
  "Solicitudes y endpoints de tu organización.",
);

export default async function DeveloperUsagePage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/desarrolladores/uso");
  }

  const [usage, analytics] = await Promise.all([
    getOrgUsageSummary(session.organizationId),
    getDashboardAnalytics(session.organizationId),
  ]);

  if (usage.error) {
    return <ErrorState message={usage.error} />;
  }

  return (
    <div className="space-y-6">
      {!usage.serviceConfigured ? <SetupError compact /> : null}

      <p className="text-sm text-muted-foreground">
        Ventana: últimas {usage.windowHours} horas. Incluye solicitudes de la API
        B2B y del panel autenticado.
      </p>

      {usage.isEmpty ? (
        <EmptyState
          title="Sin actividad registrada"
          description={
            usage.serviceConfigured
              ? "Aún no hay solicitudes para esta organización en la ventana seleccionada."
              : "Configura Supabase para registrar y consultar el uso de la API."
          }
        />
      ) : (
        <>
          <Card>
            <CardContent className="grid gap-4 p-6 sm:grid-cols-3">
              <div>
                <p className="text-sm text-muted-foreground">Total solicitudes</p>
                <p className="text-2xl font-semibold">{usage.totalRequests}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Endpoints únicos</p>
                <p className="text-2xl font-semibold">
                  {usage.byEndpoint.length}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Códigos HTTP</p>
                <p className="text-2xl font-semibold">
                  {usage.byStatus.length}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <UsageChart data={analytics.usageByDay} />
            </CardContent>
          </Card>

          <div className="grid gap-6 lg:grid-cols-2">
            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="font-semibold">Por endpoint</h2>
                <ul className="space-y-2 text-sm">
                  {usage.byEndpoint.map((entry) => (
                    <li
                      key={entry.path}
                      className="flex items-center justify-between gap-2"
                    >
                      <span className="truncate font-mono text-xs">
                        {entry.path}
                      </span>
                      <span className="shrink-0 text-muted-foreground">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-3 p-6">
                <h2 className="font-semibold">Por estado HTTP</h2>
                <ul className="space-y-2 text-sm">
                  {usage.byStatus.map((entry) => (
                    <li
                      key={entry.status}
                      className="flex items-center justify-between gap-2"
                    >
                      <span>{entry.status}</span>
                      <span className="text-muted-foreground">
                        {entry.count}
                      </span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border text-left text-muted-foreground">
                      <th className="px-4 py-3 font-medium">Fecha</th>
                      <th className="px-4 py-3 font-medium">Método</th>
                      <th className="px-4 py-3 font-medium">Ruta</th>
                      <th className="px-4 py-3 font-medium">Estado</th>
                      <th className="px-4 py-3 font-medium">Duración</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usage.recentLogs.map((log) => (
                      <tr key={log.id} className="border-b border-border/60">
                        <td className="px-4 py-3 text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString("es-EC")}
                        </td>
                        <td className="px-4 py-3">{log.method}</td>
                        <td className="px-4 py-3 font-mono text-xs">
                          {log.path}
                        </td>
                        <td className="px-4 py-3">{log.statusCode ?? "—"}</td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {log.durationMs != null
                            ? `${log.durationMs} ms`
                            : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
