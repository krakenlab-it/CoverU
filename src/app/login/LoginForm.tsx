"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") ?? "/app";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();
  const isDemoMode = !supabase;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (!supabase) {
      router.push(redirect);
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

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col justify-center px-4 py-12">
      <h1 className="text-2xl font-bold text-foreground">Iniciar sesión</h1>
      <p className="mt-2 text-sm text-coveru-gray">
        Accede al panel de CoverÜ para tu organización.
      </p>

      {isDemoMode && (
        <div
          className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
          role="status"
        >
          <strong>Modo demo:</strong> Supabase no está configurado. Puedes
          entrar al panel sin credenciales.
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {!isDemoMode && (
          <>
            <div>
              <label htmlFor="email" className="block text-sm font-medium">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 w-full rounded-lg border border-coveru-border px-3 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-1 focus:ring-coveru-red"
              />
            </div>
          </>
        )}

        {error && (
          <p className="text-sm text-coveru-red" role="alert">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-full bg-coveru-red px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-coveru-red-dark disabled:opacity-60"
        >
          {loading
            ? "Ingresando…"
            : isDemoMode
              ? "Entrar al panel demo"
              : "Iniciar sesión"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-coveru-gray">
        <Link href="/" className="hover:text-coveru-red">
          ← Volver al inicio
        </Link>
      </p>
    </div>
  );
}
