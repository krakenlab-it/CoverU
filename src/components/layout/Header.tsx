import Link from "next/link";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { HeaderAuthControl } from "@/components/layout/HeaderAuthControl";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { getPublicAuthNav } from "@/lib/auth/public-nav";
import { NAV_LINKS } from "@/lib/constants";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";
import { Menu } from "lucide-react";

export async function Header() {
  const authNav = await getPublicAuthNav();

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <BrandLogo href="/" size="lg" />

        <nav
          className="hidden items-center gap-1 md:flex"
          aria-label="Navegación principal"
        >
          {NAV_LINKS.map((link) => (
            <Button key={link.href} variant="ghost" size="sm" asChild>
              <Link href={link.href} className={motion.navLink}>
                {link.label}
              </Link>
            </Button>
          ))}
          <Button variant="ghost" size="sm" asChild>
            <Link href="/developers">Desarrolladores</Link>
          </Button>
          <HeaderAuthControl authNav={authNav} />
          <Button variant="brand" size="sm" asChild className="rounded-full">
            <Link href="/comparar">Comparar</Link>
          </Button>
        </nav>

        <div className="flex items-center gap-2 md:hidden">
          <HeaderAuthControl authNav={authNav} />
          <Button variant="brand" size="sm" asChild className="rounded-full">
            <Link href="/comparar">Comparar</Link>
          </Button>
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Abrir menú">
                <Menu className="size-4" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader>
                <SheetTitle>Menú</SheetTitle>
              </SheetHeader>
              <nav
                className="mt-6 flex flex-col gap-1"
                aria-label="Navegación móvil"
              >
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                      motion.navLink,
                    )}
                  >
                    {link.label}
                  </Link>
                ))}
                <Link
                  href="/developers"
                  className={cn(
                    "rounded-md px-3 py-2 text-sm font-medium hover:bg-muted",
                    motion.navLink,
                  )}
                >
                  Desarrolladores
                </Link>
                <HeaderAuthControl authNav={authNav} variant="mobile" />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
