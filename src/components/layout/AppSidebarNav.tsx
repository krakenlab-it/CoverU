"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Code2,
  GitCompare,
  LayoutDashboard,
  LayoutGrid,
  MessageCircle,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";

export type AppNavIcon =
  | "dashboard"
  | "marketplace"
  | "compare"
  | "developers"
  | "settings"
  | "coverage";

export type AppNavItem = {
  href: string;
  label: string;
  icon: AppNavIcon;
};

const ICONS: Record<AppNavIcon, LucideIcon> = {
  dashboard: LayoutDashboard,
  marketplace: LayoutGrid,
  compare: GitCompare,
  developers: Code2,
  settings: Settings,
  coverage: MessageCircle,
};

function isNavItemActive(pathname: string, href: string): boolean {
  if (href === "/app") {
    return pathname === "/app" || pathname === "/app/dashboard";
  }
  if (href === "/app/marketplace") {
    return (
      pathname === href ||
      (pathname.startsWith("/app/marketplace") &&
        !pathname.startsWith("/app/marketplace/compare"))
    );
  }
  if (href.startsWith("/app/asistente-cobertura")) {
    return pathname.startsWith("/app/asistente-cobertura");
  }
  if (href.startsWith("/app/desarrolladores")) {
    return pathname.startsWith("/app/desarrolladores");
  }
  if (href.startsWith("/app/configuracion")) {
    return pathname.startsWith("/app/configuracion");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type AppSidebarNavProps = {
  items: readonly AppNavItem[];
  collapsed?: boolean;
  onNavigate?: () => void;
  id?: string;
  className?: string;
};

export function AppSidebarNav({
  items,
  collapsed = false,
  onNavigate,
  id,
  className,
}: AppSidebarNavProps) {
  const pathname = usePathname();

  return (
    <nav
      id={id}
      aria-label="Navegación del panel"
      className={cn("flex flex-col gap-1", className)}
    >
      {items.map((item) => {
        const active = isNavItemActive(pathname, item.href);
        const Icon = ICONS[item.icon];
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            title={collapsed ? item.label : undefined}
            className={cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              motion.navLink,
              active
                ? "bg-primary/10 text-primary"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
              collapsed && "justify-center px-2",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            <span className={cn(collapsed && "sr-only")}>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
