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
import { buildAuthCallbackUrl } from "@/lib/auth/site-url";
import { createClient } from "@/lib/supabase/client";
import { type CoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";
import { useLogCoveruEnv } from "@/lib/supabase/use-log-coveru-env";

type RegistroFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
  envDiagnostics: CoveruEnvDiagnostics;
};

type FormState = "idle" | "confirm-email" | "success";

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
  const [formState, setFormState] = useState<FormState>("idle");

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

    if (!organizationName.trim()) {
      setError("Ingresa el nombre de tu organización.");
      return;
    }

    setLoading(true);

    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      setLoading(false);
      return;
    }

    const emailRedirectTo = buildAuthCallbackUrl("/app");

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          organization_name: organizationName.trim(),
        },
        emailRedirectTo,
      },
    });

    if (signUpError) {
      setLoading(false);
      setError(
        "No pudimos crear tu cuenta. Verifica tus datos e inténtalo de nuevo.",
      );
      return;
    }

    if (data.session) {
      const { error: provisionError } = await supabase.rpc(
        "provision_my_organization",
        { p_organization_name: organizationName.trim() },
      );

      if (provisionError) {
        setLoading(false);
        setError(
          "Tu cuenta se creó, pero no pudimos preparar tu organización. Contacta soporte.",
        );
        return;
      }

      setFormState("success");
      setLoading(false);
      router.push("/app");
      router.refresh();
      return;
    }

    setLoading(false);
    setFormState("confirm-email");
  }

  if (!supabaseConfigured) {
    return (
      <AuthPageShell>
        <SetupError diagnostics={envDiagnostics} />
        <AuthPageFooter />
      </AuthPageShell>
    );
  }

  if (formState === "confirm-email") {
    return (
      <AuthPageShell>
        <Card>
          <CardHeader>
            <CardTitle>Revisa tu correo</CardTitle>
            <p className="text-sm text-muted-foreground">
              Te enviamos un enlace de confirmación a{" "}
              <span className="font-medium text-foreground">{email}</span>.
              Confírmalo para acceder al panel de CoverÜ.
            </p>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              ¿Ya confirmaste?{" "}
              <Link href="/login" className="text-primary hover:underline">
                Inicia sesión
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
                {error}
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
