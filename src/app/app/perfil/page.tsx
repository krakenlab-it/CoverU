import { DemoAlert } from "@/components/platform/DemoAlert";
import { DemoBadge } from "@/components/platform/DemoBadge";
import { PageHeader } from "@/components/platform/PageHeader";
import { Card, CardContent } from "@/components/ui/card";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { createClient } from "@/lib/supabase/server";

export const metadata = buildAppMetadata(
  "Perfil",
  "Contexto de tu sesión en el marketplace CoverÜ.",
);

export default async function PerfilPage() {
  const session = await requireAuthWithOrg();
  const supabase = await createClient();
  const isDemoMode = !supabase;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <PageHeader
        title="Perfil y organización"
        description="Contexto de tu sesión en el marketplace CoverÜ."
      />

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="font-semibold text-primary">Usuario</h2>
          <dl className="space-y-2 text-sm">
            <div>
              <dt className="text-muted-foreground">Correo</dt>
              <dd className="font-medium">{session?.user.email ?? "—"}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Modo</dt>
              <dd className="font-medium">
                {isDemoMode ? "Demo (sin Supabase configurado)" : "Autenticado"}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-6">
          <h2 className="font-semibold text-primary">Organizaciones</h2>
          <ul className="space-y-3">
            {session?.memberships.map((m) => (
              <li
                key={m.organizationId}
                className="rounded-xl border border-border p-4 text-sm"
              >
                <p className="font-semibold">{m.organizationName}</p>
                <p className="text-muted-foreground">Rol: {m.role}</p>
                {m.isDemo ? (
                  <span className="mt-2 inline-flex">
                    <DemoBadge />
                  </span>
                ) : null}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {isDemoMode ? (
        <DemoAlert compact />
      ) : null}
    </div>
  );
}
