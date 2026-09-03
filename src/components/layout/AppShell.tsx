import { AppSidebar } from "@/components/layout/AppSidebar";

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
    <div className="flex min-h-screen flex-col bg-muted/30 md:flex-row">
      <AppSidebar
        organizationName={organizationName}
        userEmail={userEmail}
        supabaseUrl={supabaseUrl}
        supabaseAnonKey={supabaseAnonKey}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6">
          <main
            id="main-content"
            tabIndex={-1}
            className="outline-none"
            role="main"
          >
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}
