import Link from "next/link";
import { NAV_LINKS, SITE_NAME } from "@/lib/constants";

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-coveru-border bg-white/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <Link
          href="/"
          className="text-2xl font-bold tracking-tight text-coveru-red"
          aria-label={`${SITE_NAME} — inicio`}
        >
          Cover<span className="underline decoration-2 underline-offset-4">Ü</span>
        </Link>

        <nav
          className="hidden items-center gap-6 md:flex"
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
          <Link
            href="/developers"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-coveru-red"
          >
            Desarrolladores
          </Link>
          <Link
            href="/app"
            className="text-sm font-medium text-foreground/80 transition-colors hover:text-coveru-red"
          >
            Panel
          </Link>
        </nav>

        <Link
          href="/comparar"
          className="rounded-full bg-coveru-red px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-coveru-red-dark md:hidden"
        >
          Comparar
        </Link>
      </div>

      <nav
        className="flex gap-1 overflow-x-auto border-t border-coveru-border px-4 py-2 md:hidden"
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
      </nav>
    </header>
  );
}
