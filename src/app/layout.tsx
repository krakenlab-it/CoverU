import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { SiteChrome } from "@/components/layout/SiteChrome";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "CoverÜ — Comparador de seguros de salud",
    template: "%s | CoverÜ",
  },
  description:
    "Compara planes de seguro de salud en Chile. Datos de demostración hasta integrar aseguradoras reales.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-white text-foreground">
        <SiteChrome>{children}</SiteChrome>
      </body>
    </html>
  );
}
