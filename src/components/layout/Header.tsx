import Link from "next/link";
import { NAV_LINKS } from "@/lib/constants";
import { CoverULogoLink } from "@/components/marketing/CoverULogo";
import { WhatsAppContactLink } from "@/components/marketing/WhatsAppContactLink";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-coveru-border bg-white/95 backdrop-blur">
      <div className="marketing-layout">
        <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3 py-4">
          <nav
            className="hidden items-center gap-5 lg:flex"
            aria-label="Navegación principal"
          >
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sm font-medium text-foreground/80 transition-colors hover:text-coveru-red"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="justify-self-center">
            <CoverULogoLink priority />
          </div>

          <div className="flex items-center justify-end gap-3">
            <Link
              href="/login"
              className="hidden text-sm font-medium text-foreground/70 transition-colors hover:text-coveru-red sm:inline-flex"
            >
              Iniciar sesión
            </Link>
            <WhatsAppContactLink
              className="marketing-pill bg-coveru-red px-4 py-2 text-sm text-white hover:bg-coveru-red-dark sm:px-5 sm:py-2.5"
              ariaLabel="Quiero Asegurarme por WhatsApp"
            >
              Quiero Asegurarme
            </WhatsAppContactLink>
          </div>
        </div>

        <nav
          className="flex gap-1 overflow-x-auto border-t border-coveru-border py-2 lg:hidden"
          aria-label="Navegación móvil"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-coveru-light hover:text-coveru-red"
            >
              {link.label}
            </Link>
          ))}
          <Link
            href="/login"
            className="shrink-0 rounded-full px-3 py-1.5 text-xs font-medium text-foreground/70 hover:bg-coveru-light hover:text-coveru-red"
          >
            Iniciar sesión
          </Link>
        </nav>
      </div>
    </header>
  );
}
