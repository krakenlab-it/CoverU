import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SkipLink } from "@/components/platform/SkipLink";
import { TooltipProvider } from "@/components/ui/tooltip";
import { MARKETING_SITE_NAME } from "@/lib/constants";
import { MARKETING_ASSETS } from "@/lib/marketing-assets";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  ...buildPublicMetadata({
    path: "/",
    title: "Seguros Para Empresa y Personas",
    description:
      "Encuentra el seguro de salud ideal y contrátalo 100% en línea. Compara planes con Cover U.",
  }),
  manifest: MARKETING_ASSETS.siteWebManifest,
  icons: {
    icon: MARKETING_ASSETS.imagotipo,
    apple: MARKETING_ASSETS.webAppManifestIcon512,
  },
  appleWebApp: {
    title: MARKETING_SITE_NAME,
  },
  other: {
    "theme-color": "#df0926",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es-EC" className={cn("h-full antialiased", poppins.variable)}>
      <body className="flex min-h-full flex-col bg-background text-foreground">
        <TooltipProvider delayDuration={300}>
          <SkipLink />
          <SiteChrome>{children}</SiteChrome>
        </TooltipProvider>
      </body>
    </html>
  );
}
