import { Suspense } from "react";
import RecuperarForm from "./RecuperarForm";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import {
  buildCoveruEnvDiagnostics,
  logCoveruEnv,
} from "@/lib/supabase/env-diagnostics";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildPublicMetadata({
  title: "Recuperar contraseña",
  description: "Solicita un enlace para restablecer tu contraseña de CoverÜ.",
  path: "/recuperar",
  noIndex: true,
});

export default function RecuperarPage() {
  const { url, anonKey } = getSupabasePublicConfig();
  const envDiagnostics = buildCoveruEnvDiagnostics({
    route: "/recuperar",
    url,
    anonKey,
  });

  logCoveruEnv(envDiagnostics);

  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando…</p>}>
      <RecuperarForm
        supabaseUrl={url}
        supabaseAnonKey={anonKey}
        envDiagnostics={envDiagnostics}
      />
    </Suspense>
  );
}
