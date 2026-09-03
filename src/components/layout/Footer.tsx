import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-border bg-muted/40">
      <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <BrandLogo href="/" size="md" />
            <p className="mt-2 text-sm text-muted-foreground">
              Comparador de seguros de salud en Ecuador. Datos de demostración
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
                    className="text-sm text-muted-foreground hover:text-primary"
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
            <p className="mt-3 text-sm text-muted-foreground">
              Los precios y planes mostrados en modo demo son ejemplos
              ilustrativos. No constituyen oferta ni cotización real.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          © {year} {SITE_NAME}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
