import { EmptyState } from "@/components/platform/EmptyState";
import { ErrorState } from "@/components/platform/ErrorState";
import { SetupError } from "@/components/platform/SetupError";
import { Card, CardContent } from "@/components/ui/card";
import { getOrgRequestLogs } from "@/lib/settings/request-logs";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = buildAppMetadata(
  "Registros de solicitudes",
  "Historial reciente de solicitudes API de tu organización.",
);

function formatKeyPrefix(prefix: string | null): string {
  if (!prefix) return "—";
  return `${prefix}…`;
}

export default async function RequestLogsSettingsPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/configuracion/registros");
  }

  const result = await getOrgRequestLogs(session.organizationId);

  if (result.error) {
    return <ErrorState message={result.error} />;
  }

  return (
    <div className="space-y-6">
      {!result.serviceConfigured ? <SetupError compact /> : null}

      <p className="text-sm text-muted-foreground">
        Últimas {result.windowHours} horas. Cada fila corresponde a una
        solicitud registrada en <code>api_usage_logs</code>.
      </p>

      {result.isEmpty ? (
        <EmptyState
          title="Sin registros de solicitudes"
          description={
            result.serviceConfigured
              ? "Las solicitudes aparecerán aquí cuando uses la API con una clave activa."
              : "Configura Supabase para registrar y consultar el historial de solicitudes."
          }
        />
      ) : null}

      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="px-4 py-3 font-medium">Fecha</th>
                  <th className="px-4 py-3 font-medium">Clave API</th>
                  <th className="px-4 py-3 font-medium">Método</th>
                  <th className="px-4 py-3 font-medium">Ruta</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">ID solicitud</th>
                </tr>
              </thead>
              <tbody>
                {result.logs.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-4 py-8 text-center text-muted-foreground"
                    >
                      Sin filas en la ventana seleccionada.
                    </td>
                  </tr>
                ) : (
                  result.logs.map((log) => (
                    <tr key={log.id} className="border-b border-border/60">
                      <td className="px-4 py-3 text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString("es-EC")}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {formatKeyPrefix(log.keyPrefix)}
                      </td>
                      <td className="px-4 py-3">{log.method}</td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {log.path}
                      </td>
                      <td className="px-4 py-3">{log.statusCode ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {log.requestId}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
