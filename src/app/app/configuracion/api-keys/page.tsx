import { CreateApiKeyDialog } from "@/components/settings/CreateApiKeyDialog";
import { RevokeApiKeyButton } from "@/components/settings/RevokeApiKeyButton";
import { EmptyState } from "@/components/platform/EmptyState";
import { SetupError } from "@/components/platform/SetupError";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { listOrgApiKeys } from "@/lib/settings/api-keys";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = buildAppMetadata(
  "API keys",
  "Administra las claves API de tu organización.",
);

function statusLabel(status: string): string {
  switch (status) {
    case "active":
      return "Activa";
    case "revoked":
      return "Revocada";
    case "expired":
      return "Expirada";
    default:
      return status;
  }
}

export default async function ApiKeysSettingsPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/configuracion/api-keys");
  }

  const { keys, serviceConfigured } = await listOrgApiKeys(
    session.organizationId,
  );

  return (
    <div className="space-y-6">
      {!serviceConfigured ? <SetupError compact /> : null}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Prefijo, nombre y estado. Nunca almacenamos ni mostramos la clave
          completa después de la creación.
        </p>
        <CreateApiKeyDialog disabled={!session.canAdminister || !serviceConfigured} />
      </div>

      {keys.length === 0 ? (
        <EmptyState
          title="Sin claves API"
          description={
            serviceConfigured
              ? "Crea una clave para integrar tu sistema con la API B2B."
              : "Configura Supabase para crear y administrar claves API."
          }
        />
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="px-4 py-3 font-medium">Nombre</th>
                    <th className="px-4 py-3 font-medium">Prefijo</th>
                    <th className="px-4 py-3 font-medium">Estado</th>
                    <th className="px-4 py-3 font-medium">Último uso</th>
                    <th className="px-4 py-3 font-medium">
                      <span className="sr-only">Acciones</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {keys.map((key) => (
                    <tr key={key.id} className="border-b border-border/60">
                      <td className="px-4 py-3">
                        <p className="font-medium">{key.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {key.clientName}
                        </p>
                      </td>
                      <td className="px-4 py-3 font-mono text-xs">
                        {key.keyPrefix}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={
                            key.status === "active" ? "default" : "secondary"
                          }
                        >
                          {statusLabel(key.status)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {key.lastUsedAt
                          ? new Date(key.lastUsedAt).toLocaleString("es-EC")
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {key.status === "active" && session.canAdminister ? (
                          <RevokeApiKeyButton
                            keyId={key.id}
                            keyName={key.name}
                          />
                        ) : null}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
