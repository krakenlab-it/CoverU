import { Suspense } from "react";
import RegistroForm from "./RegistroForm";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import {
  buildCoveruEnvDiagnostics,
  logCoveruEnv,
} from "@/lib/supabase/env-diagnostics";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata = buildPublicMetadata({
  title: "Crear cuenta",
  description: "Registra tu organización en CoverÜ y accede al panel.",
  path: "/registro",
  noIndex: true,
});

export default function RegistroPage() {
  const { url, anonKey } = getSupabasePublicConfig();
  const envDiagnostics = buildCoveruEnvDiagnostics({
    route: "/registro",
    url,
    anonKey,
  });

  logCoveruEnv(envDiagnostics);

  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando…</p>}>
      <RegistroForm
        supabaseUrl={url}
        supabaseAnonKey={anonKey}
        envDiagnostics={envDiagnostics}
      />
    </Suspense>
  );
}
