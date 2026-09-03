import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-coveru-border bg-coveru-light">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <p className="text-xl font-bold text-coveru-red">
              Cover<span className="underline decoration-2 underline-offset-4">Ü</span>
            </p>
            <p className="mt-2 text-sm text-coveru-gray">
              Comparador de seguros de salud en Chile. Datos de demostración
              hasta integrar aseguradoras reales.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Enlaces
            </p>
            <ul className="mt-3 space-y-2">
              {NAV_LINKS.map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-sm text-coveru-gray hover:text-coveru-red"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Aviso
            </p>
            <p className="mt-3 text-sm text-coveru-gray">
              Los precios y planes mostrados en modo demo son ejemplos
              ilustrativos. No constituyen oferta ni cotización real.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-coveru-border pt-6 text-center text-xs text-coveru-gray">
          © {year} {SITE_NAME}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
