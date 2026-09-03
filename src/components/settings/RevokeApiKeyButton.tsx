"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";

type RevokeApiKeyButtonProps = {
  keyId: string;
  keyName: string;
  disabled?: boolean;
};

export function RevokeApiKeyButton({
  keyId,
  keyName,
  disabled,
}: RevokeApiKeyButtonProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRevoke() {
    const confirmed = window.confirm(
      `¿Revocar la clave "${keyName}"? Las solicitudes con esta clave dejarán de funcionar.`,
    );
    if (!confirmed) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/app/settings/api-keys/${keyId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "revoke" }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo revocar la clave.");
        return;
      }

      router.refresh();
    } catch {
      setError("Error de red al revocar la clave.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handleRevoke}
        disabled={disabled || loading}
        aria-label={`Revocar clave ${keyName}`}
      >
        {loading ? "Revocando…" : "Revocar"}
      </Button>
      {error ? (
        <p className="text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
