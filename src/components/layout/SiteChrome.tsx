import { WhatsAppFab } from "@/components/marketing/WhatsAppFab";
import { headers } from "next/headers";
import { Footer } from "@/components/layout/Footer";
import { Header } from "@/components/layout/Header";

export async function SiteChrome({
  children,
}: {
  children: React.ReactNode;
}) {
  const headersList = await headers();
  const pathname = headersList.get("x-pathname") ?? "";
  const isPanel = pathname.startsWith("/app");
  const isLogin = pathname.startsWith("/login");

  if (isPanel) {
    return <>{children}</>;
  }

  return (
    <>
      <Header />
      <main id="main-content" tabIndex={-1} className="flex-1 outline-none">
        {children}
      </main>
      {!isLogin ? <Footer /> : null}
      <WhatsAppFab />
    </>
  );
}
