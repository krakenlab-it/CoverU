import { AppShellClient } from "@/components/layout/AppShellClient";

type AppShellProps = {
  children: React.ReactNode;
  organizationName?: string;
  userEmail?: string | null;
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function AppShell({
  children,
  organizationName,
  userEmail,
  supabaseUrl,
  supabaseAnonKey,
}: AppShellProps) {
  return (
    <AppShellClient
      organizationName={organizationName}
      userEmail={userEmail}
      supabaseUrl={supabaseUrl}
      supabaseAnonKey={supabaseAnonKey}
    >
      {children}
    </AppShellClient>
  );
}
