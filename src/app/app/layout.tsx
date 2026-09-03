import { AppShell } from "@/components/layout/AppShell";
import { SetupError } from "@/components/platform/SetupError";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";
import {
  getSupabasePublicConfig,
  isSupabasePublicConfigComplete,
} from "@/lib/supabase/public-config";
import { redirect } from "next/navigation";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabaseConfig = getSupabasePublicConfig();

  if (!isSupabasePublicConfigComplete(supabaseConfig)) {
    const envDiagnostics = buildCoveruEnvDiagnostics({
      route: "/app",
      url: supabaseConfig.url,
      anonKey: supabaseConfig.anonKey,
    });

    return (
      <div className="mx-auto max-w-2xl px-4 py-12">
        <SetupError diagnostics={envDiagnostics} />
      </div>
    );
  }

  const session = await requireAuthWithOrg();

  if (!session) {
    redirect("/login?redirect=/app");
  }

  const membership = session.memberships[0];

  return (
    <AppShell
      organizationName={membership?.organizationName}
      userEmail={session.user.email}
    >
      {children}
    </AppShell>
  );
}
