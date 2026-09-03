"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { SetupError } from "@/components/platform/SetupError";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createClient } from "@/lib/supabase/client";

type LoginFormProps = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export default function LoginForm({
  supabaseUrl,
  supabaseAnonKey,
}: LoginFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);
  const supabase = supabaseConfigured
    ? createClient({ url: supabaseUrl, anonKey: supabaseAnonKey })
    : null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      setError("Supabase no está configurado en este entorno.");
      setLoading(false);
      return;
    }

    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError("Credenciales inválidas. Verifica tu email y contraseña.");
      return;
    }

    router.push(redirect);
    router.refresh();
  }

  if (!supabaseConfigured) {
    return (
      <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
        <SetupError />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/" className="hover:text-primary">
            ← Volver al inicio
          </Link>
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <Card>
        <CardHeader>
          <CardTitle>Iniciar sesión</CardTitle>
          <p className="text-sm text-muted-foreground">
            Accede al panel de CoverÜ para tu organización.
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
            <div className="space-y-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
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
              {loading ? "Ingresando…" : "Iniciar sesión"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="hover:text-primary">
              ← Volver al inicio
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
