import { AppNav } from "@/components/marketplace/AppNav";
import { DemoBanner } from "@/components/marketplace/DemoBanner";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await requireAuthWithOrg();

  if (!session) {
    redirect("/login?redirect=/app");
  }

  const isDemo = session.memberships.every((m) => m.isDemo);

  return (
    <div className="min-h-screen bg-coveru-light">
      <AppNav />
      <div className="mx-auto max-w-7xl space-y-4 px-4 py-6">
        {isDemo && <DemoBanner />}
        {children}
      </div>
    </div>
  );
}
