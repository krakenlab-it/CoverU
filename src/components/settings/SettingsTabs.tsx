"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SETTINGS_NAV_ITEMS } from "@/lib/settings/navigation";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones de configuración">
      <div
        role="tablist"
        aria-orientation="horizontal"
        className="flex flex-wrap gap-1 rounded-lg border border-border bg-muted/40 p-1"
      >
        {SETTINGS_NAV_ITEMS.map((item) => {
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              role="tab"
              aria-selected={active}
              aria-current={active ? "page" : undefined}
              className={cn(
                "rounded-md px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                motion.navLink,
                active
                  ? "bg-background text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
