import { Suspense } from "react";
import LoginForm from "./LoginForm";
import { buildPublicMetadata } from "@/lib/seo/metadata";
import { getSupabasePublicConfig } from "@/lib/supabase/public-config";

export const metadata = buildPublicMetadata({
  title: "Iniciar sesión",
  description: "Accede al panel de CoverÜ para tu organización.",
  path: "/login",
  noIndex: true,
});

export default function LoginPage() {
  const { url, anonKey } = getSupabasePublicConfig();

  return (
    <Suspense fallback={<p className="p-8 text-center">Cargando…</p>}>
      <LoginForm supabaseUrl={url} supabaseAnonKey={anonKey} />
    </Suspense>
  );
}
