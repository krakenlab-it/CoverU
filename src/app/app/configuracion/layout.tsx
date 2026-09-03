import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildAppMetadata } from "@/lib/seo/metadata";

export const metadata = buildAppMetadata(
  "Configuración",
  "Administra tu perfil, claves API, uso, límites y registros de la plataforma CoverÜ.",
);

export default function ConfiguracionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <PageHeader
        title="Configuración"
        description="Perfil, claves API, uso, límites y registros de solicitudes de tu organización."
      />
      <SettingsTabs />
      <div>{children}</div>
    </div>
  );
}
