import Link from "next/link";

export default function HomePage() {
  return (
    <>
      <section className="bg-gradient-to-b from-white to-coveru-light">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-wide text-coveru-red">
              Seguros de salud en Chile
            </p>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
              Encuentra el plan que{" "}
              <span className="text-coveru-red">mejor se adapta</span> a ti
            </h1>
            <p className="mt-6 text-lg text-coveru-gray">
              CoverÜ te ayuda a comparar planes de salud con precios claros,
              límites honestos y detalles expandibles. Actualmente mostramos
              datos de demostración hasta integrar aseguradoras reales.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/comparar"
                className="rounded-full bg-coveru-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coveru-red-dark"
              >
                Comparar planes
              </Link>
              <Link
                href="/nosotros"
                className="rounded-full border border-coveru-border px-6 py-3 text-sm font-semibold text-foreground transition-colors hover:border-coveru-red hover:text-coveru-red"
              >
                Conocer CoverÜ
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <h2 className="text-2xl font-bold text-foreground">
          ¿Por qué CoverÜ?
        </h2>
        <div className="mt-8 grid gap-6 sm:grid-cols-3">
          <div className="rounded-2xl border border-coveru-border p-6">
            <h3 className="font-semibold text-coveru-red">Precios claros</h3>
            <p className="mt-2 text-sm text-coveru-gray">
              Cada plan muestra &ldquo;tú pagas $X&rdquo; con deducible, copago
              y tope anual sin letra chica oculta.
            </p>
          </div>
          <div className="rounded-2xl border border-coveru-border p-6">
            <h3 className="font-semibold text-coveru-red">Límites honestos</h3>
            <p className="mt-2 text-sm text-coveru-gray">
              Exclusiones y topes visibles desde el inicio, con detalles
              expandibles para cada plan.
            </p>
          </div>
          <div className="rounded-2xl border border-coveru-border p-6">
            <h3 className="font-semibold text-coveru-red">Hecho para Chile</h3>
            <p className="mt-2 text-sm text-coveru-gray">
              Filtros por edad, género y región para comparar tarifas
              relevantes a tu situación.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-coveru-light">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6">
            <p className="text-sm font-semibold text-amber-900">
              Modo demostración
            </p>
            <p className="mt-2 text-sm text-amber-800">
              Los planes y precios mostrados son datos de ejemplo ilustrativos.
              No constituyen oferta comercial ni cotización real de
              aseguradoras.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
