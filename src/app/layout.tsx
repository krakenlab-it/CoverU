import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import { SkipLink } from "@/components/platform/SkipLink";
import { TooltipProvider } from "@/components/ui/tooltip";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { cn } from "@/lib/utils";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  ...buildPublicMetadata({ path: "/" }),
  manifest: "/site.webmanifest",
  icons: {
    icon: [{ url: "/favicon.ico" }, { url: "/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: [{ url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" }],
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
