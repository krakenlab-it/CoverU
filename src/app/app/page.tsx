import { requireAuthWithOrg } from "@/lib/auth/org";
import Link from "next/link";

export const metadata = {
  title: "Panel",
};

export default async function AppPage() {
  const session = await requireAuthWithOrg();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold">Bienvenido al panel CoverÜ</h1>
        <p className="mt-2 text-coveru-gray">
          Gestiona tu integración B2B y consulta el catálogo de planes de
          demostración.
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-coveru-border bg-white p-6">
          <h2 className="font-semibold text-coveru-red">Tu organización</h2>
          <ul className="mt-3 space-y-2 text-sm text-coveru-gray">
            {session?.memberships.map((m) => (
              <li key={m.organizationId}>
                {m.organizationName}{" "}
                <span className="text-xs">({m.role})</span>
                {m.isDemo && (
                  <span className="ml-1 rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">
                    DEMO
                  </span>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-coveru-border bg-white p-6">
          <h2 className="font-semibold text-coveru-red">API B2B</h2>
          <p className="mt-2 text-sm text-coveru-gray">
            Consulta la documentación de la API v1 para integrar catálogo,
            cotizaciones y preguntas de cobertura.
          </p>
          <Link
            href="/developers"
            className="mt-4 inline-block text-sm font-semibold text-coveru-red hover:text-coveru-red-dark"
          >
            Ver documentación →
          </Link>
        </div>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        <strong>Aviso demo:</strong> Todos los datos mostrados en este panel y
        la API son de demostración. No representan productos ni precios reales.
      </section>
    </div>
  );
}
