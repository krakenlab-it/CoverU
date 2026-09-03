import Link from "next/link";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { createClient } from "@/lib/supabase/server";

const NAV_ITEMS = [
  { href: "/app/marketplace", label: "Marketplace" },
  { href: "/app/marketplace/compare", label: "Comparar" },
  { href: "/app/perfil", label: "Perfil" },
  { href: "/developers", label: "API" },
] as const;

export async function AppNav() {
  const session = await requireAuthWithOrg();
  const supabase = await createClient();
  const isDemoMode = !supabase;

  const membership = session?.memberships[0];

  return (
    <header className="border-b border-coveru-border bg-white">
      <div className="mx-auto flex max-w-7xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link href="/app/marketplace" className="text-xl font-bold text-coveru-red">
            CoverÜ <span className="text-sm font-medium text-foreground">Marketplace</span>
          </Link>
          <p className="text-xs text-coveru-gray">
            {membership?.organizationName ?? "Sin organización"}
            {(membership?.isDemo || isDemoMode) && (
              <span className="ml-2 rounded bg-amber-100 px-1.5 py-0.5 text-amber-800">
                DEMO
              </span>
            )}
          </p>
        </div>

        <nav aria-label="Navegación del panel" className="flex flex-wrap gap-3 text-sm">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="font-medium text-foreground hover:text-coveru-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/"
            className="font-medium text-coveru-gray hover:text-coveru-red focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
          >
            Sitio público
          </Link>
        </nav>
      </div>
    </header>
  );
}
