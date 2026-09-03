import { AppSidebar } from "@/components/layout/AppSidebar";
import { DemoAlert } from "@/components/platform/DemoAlert";

type AppShellProps = {
  children: React.ReactNode;
  organizationName?: string;
  userEmail?: string | null;
  isDemo?: boolean;
  showDemoBanner?: boolean;
};

export function AppShell({
  children,
  organizationName,
  userEmail,
  isDemo,
  showDemoBanner,
}: AppShellProps) {
  return (
    <div className="flex min-h-screen flex-col bg-muted/30 md:flex-row">
      <AppSidebar
        organizationName={organizationName}
        userEmail={userEmail}
        isDemo={isDemo}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="mx-auto w-full max-w-7xl flex-1 space-y-4 px-4 py-6">
          {showDemoBanner ? <DemoAlert /> : null}
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
