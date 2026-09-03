"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AuthPageFooter, AuthPageShell } from "@/components/auth/AuthPageShell";
import { SetupError } from "@/components/platform/SetupError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";
import { type CoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";
import { useLogCoveruEnv } from "@/lib/supabase/use-log-coveru-env";

type ActualizarContrasenaFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  envDiagnostics: CoveruEnvDiagnostics;
};

export default function ActualizarContrasenaForm({
  supabaseUrl,
  supabaseAnonKey,
  envDiagnostics,
}: ActualizarContrasenaFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const supabase = supabaseConfigured
    ? createClient({ url: supabaseUrl, anonKey: supabaseAnonKey })
    : null;

  useLogCoveruEnv(envDiagnostics, "warn", !supabaseConfigured);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    if (password.length < 8) {
      setError("La contraseña debe tener al menos 8 caracteres.");
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      setLoading(false);
      return;
    }

    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session) {
      setLoading(false);
      setError(
        "Tu enlace de recuperación expiró o no es válido. Solicita uno nuevo.",
      );
      return;
    }

    const { error: updateError } = await supabase.auth.updateUser({ password });

    setLoading(false);

    if (updateError) {
      setError("No pudimos actualizar tu contraseña. Inténtalo de nuevo.");
      return;
    }

    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  if (!supabaseConfigured) {
    return (
      <AuthPageShell>
        <SetupError diagnostics={envDiagnostics} />
        <AuthPageFooter />
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <Card>
        <CardHeader>
          <CardTitle>Nueva contraseña</CardTitle>
          <p className="text-sm text-muted-foreground">
            Elige una contraseña segura para tu cuenta de CoverÜ.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Nueva contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                autoComplete="new-password"
                minLength={8}
              />
            </div>

            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="brand"
              className="w-full rounded-full"
              disabled={loading}
            >
              {loading ? "Guardando…" : "Actualizar contraseña"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/recuperar" className="text-primary hover:underline">
              Solicitar un nuevo enlace
            </Link>
          </p>

          <AuthPageFooter />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
