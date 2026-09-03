"use client";

import { useState } from "react";
import Link from "next/link";
import { AuthPageFooter, AuthPageShell } from "@/components/auth/AuthPageShell";
import { SetupError } from "@/components/platform/SetupError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { buildAuthCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";
import { type CoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";
import { useLogCoveruEnv } from "@/lib/supabase/use-log-coveru-env";

type RecuperarFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  envDiagnostics: CoveruEnvDiagnostics;
};

export default function RecuperarForm({
  supabaseUrl,
  supabaseAnonKey,
  envDiagnostics,
}: RecuperarFormProps) {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const supabase = supabaseConfigured
    ? createClient({ url: supabaseUrl, anonKey: supabaseAnonKey })
    : null;

  useLogCoveruEnv(envDiagnostics, "warn", !supabaseConfigured);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      setLoading(false);
      return;
    }

    const redirectTo = buildAuthCallbackUrl("/actualizar-contrasena");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(
      email,
      { redirectTo },
    );

    setLoading(false);

    if (resetError) {
      setError(
        "No pudimos enviar el enlace. Verifica tu email e inténtalo de nuevo.",
      );
      return;
    }

    setSent(true);
  }

  if (!supabaseConfigured) {
    return (
      <AuthPageShell>
        <SetupError diagnostics={envDiagnostics} />
        <AuthPageFooter />
      </AuthPageShell>
    );
  }

  if (sent) {
    return (
      <AuthPageShell>
        <Card>
          <CardHeader>
            <CardTitle>Revisa tu correo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Si existe una cuenta con{" "}
              <span className="font-medium text-foreground">{email}</span>,
              recibirás un enlace para restablecer tu contraseña.
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              <Link href="/login" className="text-primary hover:underline">
                Volver a iniciar sesión
              </Link>
            </p>
            <AuthPageFooter />
          </CardContent>
        </Card>
      </AuthPageShell>
    );
  }

  return (
    <AuthPageShell>
      <Card>
        <CardHeader>
          <CardTitle>Recuperar contraseña</CardTitle>
          <p className="text-sm text-muted-foreground">
            Te enviaremos un enlace para restablecer tu contraseña.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
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
              {loading ? "Enviando…" : "Enviar enlace"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            <Link href="/login" className="text-primary hover:underline">
              ← Volver a iniciar sesión
            </Link>
          </p>

          <AuthPageFooter />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
