import { ApiDocsContent } from "@/components/developers/ApiDocsContent";
import { requireSettingsSession } from "@/lib/settings/session";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata = buildAppMetadata(
  "Documentación de la API",
  "Referencia de endpoints, autenticación y ejemplos para integrar CoverÜ.",
);

export default async function DeveloperDocsPage() {
  const session = await requireSettingsSession();
  if (!session) {
    redirect("/login?redirect=/app/desarrolladores/docs");
  }

  return <ApiDocsContent />;
}
