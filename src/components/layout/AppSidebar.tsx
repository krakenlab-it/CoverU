"use client";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { APP_NAV_ITEMS } from "@/lib/settings/navigation";
import { cn } from "@/lib/utils";
import { motion } from "@/lib/motion";
import { ChevronLeft, ChevronRight, Menu } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { BrandLogo } from "@/components/layout/BrandLogo";
import { AppSidebarNav } from "@/components/layout/AppSidebarNav";

const SIDEBAR_COLLAPSED_KEY = "coveru-app-sidebar-collapsed";

function readCollapsedPreference(): boolean {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === "true";
}

type AppSidebarProps = {
  organizationName?: string;
  userEmail?: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function SidebarContent({
  organizationName,
  userEmail,
  supabaseUrl,
  supabaseAnonKey,
  collapsed,
  onNavigate,
}: AppSidebarProps & {
  collapsed?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full flex-col">
      <div className={cn("px-3 py-4", collapsed && "px-2")}>
        <BrandLogo
          href="/app/marketplace"
          subtitle={collapsed ? undefined : "Plataforma"}
          size="sm"
          className={cn(collapsed && "items-center")}
        />
      </div>

      <AppSidebarNav
        id="app-sidebar-nav"
        items={APP_NAV_ITEMS}
        collapsed={collapsed}
        onNavigate={onNavigate}
        className="flex-1 px-2"
      />

      <div className="mt-auto border-t border-border p-3">
        <div
          className={cn(
            "rounded-lg bg-muted/60 p-3 text-xs",
            collapsed && "px-2 text-center",
          )}
        >
          <p
            className={cn(
              "truncate font-medium text-foreground",
              collapsed && "sr-only",
            )}
          >
            {organizationName ?? "Sin organización"}
          </p>
          {userEmail ? (
            <p
              className={cn(
                "mt-0.5 truncate text-muted-foreground",
                collapsed && "sr-only",
              )}
            >
              {userEmail}
            </p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size="sm"
          asChild
          className={cn("mt-2 w-full justify-start", collapsed && "px-2")}
        >
          <Link href="/" onClick={onNavigate}>
            {collapsed ? (
              <span className="sr-only">Sitio público</span>
            ) : (
              "Sitio público"
            )}
          </Link>
        </Button>
        <LogoutButton
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
          collapsed={collapsed}
          onNavigate={onNavigate}
        />
      </div>
    </div>
  );
}

export function AppSidebar({
  organizationName,
  userEmail,
  supabaseUrl,
  supabaseAnonKey,
}: AppSidebarProps) {
  const [collapsed, setCollapsed] = useState(readCollapsedPreference);
  const [mobileOpen, setMobileOpen] = useState(false);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      window.localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(next));
      return next;
    });
  }

  return (
    <>
      <div className="flex items-center gap-2 border-b border-border bg-background px-4 py-3 md:hidden">
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              aria-label="Abrir menú de navegación"
            >
              <Menu className="size-4" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[min(100vw-2rem,18rem)] p-0">
            <SheetHeader className="sr-only">
              <SheetTitle>Menú del panel</SheetTitle>
            </SheetHeader>
            <SidebarContent
              organizationName={organizationName}
              userEmail={userEmail}
              supabaseUrl={supabaseUrl}
              supabaseAnonKey={supabaseAnonKey}
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
        <BrandLogo href="/app/marketplace" subtitle="Plataforma" size="sm" />
      </div>

      <aside
        className={cn(
          "hidden shrink-0 border-r border-border bg-background md:flex md:flex-col",
          motion.panel,
          collapsed ? "w-[4.5rem]" : "w-64",
        )}
        aria-label="Barra lateral del panel"
      >
        <SidebarContent
          organizationName={organizationName}
          userEmail={userEmail}
          supabaseUrl={supabaseUrl}
          supabaseAnonKey={supabaseAnonKey}
          collapsed={collapsed}
        />
        <div className="border-t border-border p-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="w-full justify-center"
            onClick={toggleCollapsed}
            aria-expanded={!collapsed}
            aria-controls="app-sidebar-nav"
            aria-label={
              collapsed ? "Expandir barra lateral" : "Contraer barra lateral"
            }
          >
            {collapsed ? (
              <ChevronRight className="size-4" aria-hidden="true" />
            ) : (
              <>
                <ChevronLeft className="size-4" aria-hidden="true" />
                <span className="ms-1">Contraer</span>
              </>
            )}
          </Button>
        </div>
      </aside>
    </>
  );
}
