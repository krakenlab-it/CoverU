import { DeveloperTabs } from "@/components/developers/DeveloperTabs";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildAppMetadata } from "@/lib/seo/metadata";

export const metadata = buildAppMetadata(
  "Desarrolladores",
  "Claves API, uso, registros y documentación para integrar CoverÜ.",
);

export default function DesarrolladoresLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Desarrolladores"
        description="Genera claves API, revisa el uso y consulta los registros de solicitudes de tu organización."
      />
      <DeveloperTabs />
      <div>{children}</div>
    </div>
  );
}
