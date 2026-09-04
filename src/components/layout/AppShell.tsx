import { AppSidebar } from "@/components/layout/AppSidebar";
import { CoverageAssistantTrigger } from "@/components/layout/CoverageAssistantTrigger";

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
        <header
          className="sticky top-0 z-30 flex items-center justify-end gap-2 border-b border-border bg-background/95 px-4 py-2 backdrop-blur supports-[backdrop-filter]:bg-background/80"
          aria-label="Barra superior del panel"
        >
          <CoverageAssistantTrigger />
        </header>
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
