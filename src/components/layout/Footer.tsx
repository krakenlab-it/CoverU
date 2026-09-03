import Link from "next/link";
import { FOOTER_EXTRA_LINKS, MARKETING_SITE_NAME, NAV_LINKS } from "@/lib/constants";
import { CoverULogoLink } from "@/components/marketing/CoverULogo";

export function Footer() {
  const year = new Date().getFullYear();
  const allLinks = [...NAV_LINKS, ...FOOTER_EXTRA_LINKS];

  return (
    <footer className="border-t border-coveru-border bg-coveru-light">
      <div className="marketing-layout py-10">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <CoverULogoLink />
            <p className="mt-3 text-sm text-coveru-gray">
              Compara seguros de salud en Ecuador de forma clara y 100% en línea.
              Sin letra chica, fácil y seguro.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-foreground">
              Enlaces
            </p>
            <ul className="mt-3 space-y-2">
              {allLinks.map((link) => (
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
              Legal
            </p>
            <p className="mt-3 text-sm text-coveru-gray">
              La información publicada es referencial. Para contratar un plan,
              contacta a la aseguradora o a un agente autorizado.
            </p>
          </div>
        </div>

        <div className="mt-8 border-t border-coveru-border pt-6 text-center text-xs text-coveru-gray">
          © {year} {MARKETING_SITE_NAME}. Todos los derechos reservados.
        </div>
      </div>
    </footer>
  );
}
