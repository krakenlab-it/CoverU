import { RequestLogsTable } from "@/components/settings/RequestLogsTable";
import { EmptyState } from "@/components/platform/EmptyState";
import { ErrorState } from "@/components/platform/ErrorState";
import { SetupError } from "@/components/platform/SetupError";
import { getOrgRequestLogs } from "@/lib/settings/request-logs";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildAppMetadata(
  "Registros de solicitudes",
  "Historial reciente de solicitudes API de tu organización.",
);

export default async function DeveloperRequestLogsPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/desarrolladores/registros");
  }

  const result = await getOrgRequestLogs(session.organizationId);

  if (result.error) {
    return <ErrorState message={result.error} />;
  }

  return (
    <div className="space-y-6">
      {!result.serviceConfigured ? <SetupError compact /> : null}

      <p className="text-sm text-muted-foreground">
        Últimas {result.windowHours} horas. Las filas con plan asociado enlazan al
        detalle en el marketplace.
      </p>

      {result.isEmpty ? (
        <EmptyState
          title="Sin registros de solicitudes"
          description={
            result.serviceConfigured
              ? "Las solicitudes aparecerán aquí cuando uses la API o el panel autenticado."
              : "Configura Supabase para registrar y consultar el historial de solicitudes."
          }
        />
      ) : null}

      <RequestLogsTable logs={result.logs} showPlanColumn />
    </div>
  );
}
