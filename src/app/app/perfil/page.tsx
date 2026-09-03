import { requireAuthWithOrg } from "@/lib/auth/org";
import { createClient } from "@/lib/supabase/server";

export const metadata = {
  title: "Perfil",
};

export default async function PerfilPage() {
  const session = await requireAuthWithOrg();
  const supabase = await createClient();
  const isDemoMode = !supabase;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Perfil y organización</h1>
        <p className="mt-1 text-sm text-coveru-gray">
          Contexto de tu sesión en el marketplace CoverÜ.
        </p>
      </header>

      <section className="rounded-2xl border border-coveru-border bg-white p-6">
        <h2 className="font-semibold text-coveru-red">Usuario</h2>
        <dl className="mt-3 space-y-2 text-sm">
          <div>
            <dt className="text-coveru-gray">Correo</dt>
            <dd className="font-medium">{session?.user.email ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-coveru-gray">Modo</dt>
            <dd className="font-medium">
              {isDemoMode ? "Demo (sin Supabase configurado)" : "Autenticado"}
            </dd>
          </div>
        </dl>
      </section>

      <section className="rounded-2xl border border-coveru-border bg-white p-6">
        <h2 className="font-semibold text-coveru-red">Organizaciones</h2>
        <ul className="mt-3 space-y-3">
          {session?.memberships.map((m) => (
            <li
              key={m.organizationId}
              className="rounded-xl border border-coveru-border p-4 text-sm"
            >
              <p className="font-semibold">{m.organizationName}</p>
              <p className="text-coveru-gray">Rol: {m.role}</p>
              {m.isDemo && (
                <span className="mt-2 inline-block rounded bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800">
                  DEMO
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      {isDemoMode && (
        <section className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          <strong>Modo demo:</strong> Sin variables de entorno de Supabase, el
          panel funciona con datos de ejemplo en memoria. Configura{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_URL</code> y{" "}
          <code className="text-xs">NEXT_PUBLIC_SUPABASE_ANON_KEY</code> para
          autenticación real.
        </section>
      )}
    </div>
  );
}
