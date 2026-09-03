import { Suspense } from "react";
import ActualizarContrasenaForm from "./ActualizarContrasenaForm";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import {
  buildCoveruEnvDiagnostics,
  logCoveruEnv,
} from "@/lib/supabase/env-diagnostics";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildPublicMetadata({
  title: "Actualizar contraseña",
  description: "Establece una nueva contraseña para tu cuenta de CoverÜ.",
  path: "/actualizar-contrasena",
  noIndex: true,
});

export default function ActualizarContrasenaPage() {
  const { url, anonKey } = getSupabasePublicConfig();
  const envDiagnostics = buildCoveruEnvDiagnostics({
    route: "/actualizar-contrasena",
    url,
    anonKey,
  });

  logCoveruEnv(envDiagnostics);

  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando…</p>}>
      <ActualizarContrasenaForm
        supabaseUrl={url}
        supabaseAnonKey={anonKey}
        envDiagnostics={envDiagnostics}
      />
    </Suspense>
  );
}
