import { RateLimitForm } from "@/components/settings/RateLimitForm";
import { DemoAlert } from "@/components/platform/DemoAlert";
import { DemoBadge } from "@/components/platform/DemoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { getOrgRateLimitPolicy } from "@/lib/settings/rate-limits";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = buildAppMetadata(
  "Límites de tasa",
  "Política de rate limiting para la API B2B.",
);

function sourceLabel(source: string): string {
  switch (source) {
    case "organization":
      return "Configuración de organización";
    case "demo":
      return "Override en memoria (demo)";
    case "env":
      return "Variables de entorno";
    default:
      return source;
  }
}

export default async function RateLimitsSettingsPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/configuracion/limites");
  }

  const policy = await getOrgRateLimitPolicy(
    session.organizationId,
    session.isDemo,
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm text-muted-foreground">
          Límite por clave API en ventana deslizante. En Vercel multi-instancia,
          usa un backend compartido (p. ej. Redis) para límites globales
          consistentes.
        </p>
        {policy.isDemo || policy.demoMode ? <DemoBadge /> : null}
      </div>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold text-primary">Política actual</h2>
          <dl className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <dt className="text-muted-foreground">Solicitudes / ventana</dt>
              <dd className="font-medium">
                {policy.requestsPerWindow} / {policy.windowLabel}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Origen</dt>
              <dd className="font-medium">{sourceLabel(policy.source)}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Restantes (aprox.)</dt>
              <dd className="font-medium">
                {policy.remaining != null ? policy.remaining : "—"}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Reinicio</dt>
              <dd className="font-medium">
                {policy.resetAt
                  ? new Date(policy.resetAt).toLocaleString("es-EC")
                  : "—"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-4 p-6">
          <h2 className="font-semibold text-primary">
            Override de administrador
          </h2>
          <RateLimitForm
            policy={policy}
            canEdit={session.canAdminister}
          />
        </CardContent>
      </Card>

      {policy.demoMode ? <DemoAlert compact /> : null}
    </div>
  );
}
