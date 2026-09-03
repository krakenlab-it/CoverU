"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { DemoBadge } from "@/components/platform/DemoBadge";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { Menu } from "lucide-react";

export type AppNavItem = {
  href: string;
  label: string;
};

type AppShellNavProps = {
  items: readonly AppNavItem[];
  organizationName?: string;
  isDemo?: boolean;
};

function NavLinks({
  items,
  pathname,
  onNavigate,
}: {
  items: readonly AppNavItem[];
  pathname: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      {items.map((item) => {
        const active =
          pathname === item.href ||
          (item.href !== "/app/marketplace" && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              "rounded-md px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              motion.navLink,
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

export function AppShellNav({
  items,
  organizationName,
  isDemo,
}: AppShellNavProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3">
        <div className="min-w-0">
          <BrandLogo href="/app/marketplace" subtitle="Plataforma" size="sm" />
          <p className="mt-0.5 truncate text-xs text-muted-foreground">
            {organizationName ?? "Sin organización"}
            {isDemo ? (
              <span className="ms-2 inline-flex align-middle">
                <DemoBadge />
              </span>
            ) : null}
          </p>
        </div>

        <nav
          aria-label="Navegación del panel"
          className="hidden items-center gap-1 md:flex"
        >
          <NavLinks items={items} pathname={pathname} />
          <Separator orientation="vertical" className="mx-1 h-6" />
          <Button variant="ghost" size="sm" asChild>
            <Link href="/">Sitio público</Link>
          </Button>
        </nav>

        <Sheet>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="md:hidden"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[min(100vw-2rem,20rem)]">
            <SheetHeader>
              <SheetTitle>Menú del panel</SheetTitle>
            </SheetHeader>
            <nav className="mt-6 flex flex-col gap-1" aria-label="Navegación móvil del panel">
              <NavLinks items={items} pathname={pathname} />
              <Separator className="my-2" />
              <Button variant="outline" asChild className="justify-start">
                <Link href="/">Sitio público</Link>
              </Button>
            </nav>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
