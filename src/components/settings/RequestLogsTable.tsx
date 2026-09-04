import Link from "next/link";
import type { RequestLogRow } from "@/lib/settings/request-logs";
import { Card, CardContent } from "@/components/ui/card";

function formatKeyPrefix(prefix: string | null): string {
  if (!prefix) return "Sesión";
  return `${prefix}…`;
}

function planLinkForLog(log: RequestLogRow): string | null {
  if (log.planVersionId) {
    return `/app/marketplace/plans/${log.planVersionId}`;
  }
  return null;
}

type RequestLogsTableProps = {
  logs: RequestLogRow[];
  emptyMessage?: string;
  showPlanColumn?: boolean;
};

export function RequestLogsTable({
  logs,
  emptyMessage = "Sin filas en la ventana seleccionada.",
  showPlanColumn = true,
}: RequestLogsTableProps) {
  const colSpan = showPlanColumn ? 7 : 6;

  return (
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
                {showPlanColumn ? (
                  <th className="px-4 py-3 font-medium">Plan</th>
                ) : null}
                <th className="px-4 py-3 font-medium">Estado</th>
                <th className="px-4 py-3 font-medium">ID solicitud</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 ? (
                <tr>
                  <td
                    colSpan={colSpan}
                    className="px-4 py-8 text-center text-muted-foreground"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                logs.map((log) => {
                  const planHref = planLinkForLog(log);
                  return (
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
                      {showPlanColumn ? (
                        <td className="px-4 py-3">
                          {planHref ? (
                            <Link
                              href={planHref}
                              className="text-primary underline-offset-4 hover:underline"
                            >
                              Ver plan
                            </Link>
                          ) : log.planId ? (
                            <span className="text-xs text-muted-foreground">
                              Plan {log.planId.slice(0, 8)}…
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                      ) : null}
                      <td className="px-4 py-3">{log.statusCode ?? "—"}</td>
                      <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                        {log.requestId}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
