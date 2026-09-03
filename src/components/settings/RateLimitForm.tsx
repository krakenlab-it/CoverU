"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { RateLimitPolicy } from "@/lib/settings/rate-limits";

type RateLimitFormProps = {
  policy: RateLimitPolicy;
  canEdit: boolean;
};

export function RateLimitForm({ policy, canEdit }: RateLimitFormProps) {
  const router = useRouter();
  const [requests, setRequests] = useState(String(policy.requestsPerWindow));
  const [windowMinutes, setWindowMinutes] = useState(
    String(Math.round(policy.windowMs / 60000)),
  );
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const parsedRequests = Number(requests);
    const parsedWindowMs = Number(windowMinutes) * 60000;

    try {
      const response = await fetch("/api/app/settings/rate-limits", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestsPerWindow: parsedRequests,
          windowMs: parsedWindowMs,
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo guardar la configuración.");
        return;
      }

      setMessage("Configuración guardada.");
      router.refresh();
    } catch {
      setError("Error de red al guardar.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!policy.serviceConfigured ? (
        <p className="text-sm text-muted-foreground" role="status">
          Supabase no está configurado: no se pueden guardar overrides de
          organización en este entorno.
        </p>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="rate-limit-requests">Solicitudes por ventana</Label>
          <Input
            id="rate-limit-requests"
            type="number"
            min={1}
            max={10000}
            value={requests}
            onChange={(event) => setRequests(event.target.value)}
            disabled={!canEdit || !policy.serviceConfigured}
            required
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="rate-limit-window">Ventana (minutos)</Label>
          <Input
            id="rate-limit-window"
            type="number"
            min={1}
            max={1440}
            value={windowMinutes}
            onChange={(event) => setWindowMinutes(event.target.value)}
            disabled={!canEdit || !policy.serviceConfigured}
            required
          />
        </div>
      </div>

      {!canEdit ? (
        <p className="text-sm text-muted-foreground">
          Solo administradores de la organización pueden modificar los límites.
        </p>
      ) : null}

      {message ? (
        <p className="text-sm text-green-700" role="status">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      {canEdit && policy.serviceConfigured ? (
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : "Guardar límites"}
        </Button>
      ) : null}
    </form>
  );
}
