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

type RegistroFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  envDiagnostics: CoveruEnvDiagnostics;
};

async function provisionOrganization(
  supabase: NonNullable<ReturnType<typeof createClient>>,
  organizationName: string,
): Promise<string | null> {
  const { error: provisionError } = await supabase.rpc(
    "provision_my_organization",
    { p_organization_name: organizationName },
  );

  if (provisionError) {
    return "Tu cuenta se creó, pero no pudimos preparar tu organización. Contacta soporte.";
  }

  return null;
}

export default function RegistroForm({
  supabaseUrl,
  supabaseAnonKey,
  envDiagnostics,
}: RegistroFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organizationName, setOrganizationName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const supabase = supabaseConfigured
    ? createClient({ url: supabaseUrl, anonKey: supabaseAnonKey })
    : null;

  useLogCoveruEnv(envDiagnostics, "warn", !supabaseConfigured);

  async function completeSignupSession(
    trimmedOrganizationName: string,
  ): Promise<boolean> {
    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      return false;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(
        "Ya existe una cuenta con este email. Inicia sesión en /login o usa otra dirección.",
      );
      return false;
    }

    const provisionError = await provisionOrganization(
      supabase,
      trimmedOrganizationName,
    );

    if (provisionError) {
      setError(provisionError);
      return false;
    }

    router.push("/app");
    router.refresh();
    return true;
  }

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

    const trimmedOrganizationName = organizationName.trim();

    if (!trimmedOrganizationName) {
      setError("Ingresa el nombre de tu organización.");
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      setLoading(false);
      return;
    }

    const response = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email,
        password,
        organizationName: trimmedOrganizationName,
      }),
    });

    if (response.status === 409) {
      const completed = await completeSignupSession(trimmedOrganizationName);
      setLoading(false);
      if (!completed) {
        return;
      }
      return;
    }

    if (!response.ok) {
      setLoading(false);
      setError(
        "No pudimos crear tu cuenta. Verifica tus datos e inténtalo de nuevo.",
      );
      return;
    }

    const completed = await completeSignupSession(trimmedOrganizationName);
    setLoading(false);

    if (!completed) {
      return;
    }
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
          <CardTitle>Crear cuenta</CardTitle>
          <p className="text-sm text-muted-foreground">
            Registra tu organización y accede al panel de CoverÜ.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="organizationName">Nombre de la organización</Label>
              <Input
                id="organizationName"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                required
                autoComplete="organization"
              />
            </div>
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
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
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
                {error}{" "}
                {error.includes("/login") ? (
                  <Link href="/login" className="text-primary hover:underline">
                    Ir a iniciar sesión
                  </Link>
                ) : null}
              </p>
            ) : null}

            <Button
              type="submit"
              variant="brand"
              className="w-full rounded-full"
              disabled={loading}
            >
              {loading ? "Creando cuenta…" : "Crear cuenta"}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="text-primary hover:underline">
              Iniciar sesión
            </Link>
          </p>

          <AuthPageFooter />
        </CardContent>
      </Card>
    </AuthPageShell>
  );
}
