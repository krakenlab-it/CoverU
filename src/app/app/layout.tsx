import { redirect } from "next/navigation";
import Link from "next/link";
import { requireAuthWithOrg } from "@/lib/auth/org";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuthWithOrg();

  if (!session) {
    redirect("/login?redirect=/app");
  }

  return (
    <div className="min-h-screen bg-coveru-light">
      <div className="border-b border-coveru-border bg-white">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div>
            <p className="text-lg font-bold text-coveru-red">CoverÜ Panel</p>
            <p className="text-xs text-coveru-gray">
              {session.memberships[0]?.organizationName ?? "Sin organización"}
              {session.memberships[0]?.isDemo && " — DEMO"}
            </p>
          </div>
          <nav className="flex gap-4 text-sm">
            <Link href="/app" className="font-medium hover:text-coveru-red">
              Inicio
            </Link>
            <Link
              href="/developers"
              className="font-medium hover:text-coveru-red"
            >
              API
            </Link>
            <Link href="/" className="font-medium hover:text-coveru-red">
              Sitio público
            </Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-5xl px-4 py-8">{children}</div>
    </div>
  );
}
