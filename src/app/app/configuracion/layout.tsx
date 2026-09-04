import { SettingsTabs } from "@/components/settings/SettingsTabs";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildAppMetadata } from "@/lib/seo/metadata";

export const metadata = buildAppMetadata(
  "Configuración",
  "Administra el perfil de tu organización y los límites de tasa.",
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
        description="Perfil de organización y límites de tasa para administradores."
      />
      <SettingsTabs />
      <div>{children}</div>
    </div>
  );
}
