import { DemoAlert } from "@/components/platform/DemoAlert";
import { DemoBadge } from "@/components/platform/DemoBadge";
import { Card, CardContent } from "@/components/ui/card";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const metadata = buildAppMetadata(
  "Perfil y organización",
  "Contexto de tu sesión y organización en CoverÜ.",
);

export default async function PerfilSettingsPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/configuracion/perfil");
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="font-semibold text-primary">Usuario</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Correo</dt>
              <dd className="font-medium">{session.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modo</dt>
              <dd className="font-medium">
                {session.isDemoMode
                  ? "Demo (sin Supabase configurado)"
                  : "Autenticado"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="font-semibold text-primary">Organizaciones</h2>
          <ul className="space-y-3">
            {session.memberships.map((membership) => (
              <li
                key={membership.organizationId}
                className="rounded-xl border border-border p-4 text-sm"
              >
                <p className="font-semibold">{membership.organizationName}</p>
                <p className="text-muted-foreground">Rol: {membership.role}</p>
                {membership.isDemo ? (
                  <span className="mt-2 inline-flex">
                    <DemoBadge />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {session.isDemoMode ? <DemoAlert compact /> : null}
    </div>
  );
}
