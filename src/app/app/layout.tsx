import { AppShell } from "@/components/layout/AppShell";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { createClient } from "@/lib/supabase/server";
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

  const supabase = await createClient();
  const isDemoMode = !supabase;
  const isDemo = session.memberships.every((m) => m.isDemo) || isDemoMode;
  const membership = session.memberships[0];

  return (
    <AppShell
      organizationName={membership?.organizationName}
      isDemo={isDemo}
      showDemoBanner={isDemo}
    >
      {children}
    </AppShell>
  );
}
