"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoBadge } from "@/components/platform/DemoBadge";
import { Plus } from "lucide-react";

type CreateApiKeyDialogProps = {
  isDemo: boolean;
  disabled?: boolean;
};

export function CreateApiKeyDialog({
  isDemo,
  disabled,
}: CreateApiKeyDialogProps) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [rawKey, setRawKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/app/settings/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "No se pudo crear la clave.");
        return;
      }

      setRawKey(data.rawKey);
      router.refresh();
    } catch {
      setError("Error de red al crear la clave.");
    } finally {
      setLoading(false);
    }
  }

  function handleOpenChange(next: boolean) {
    setOpen(next);
    if (!next) {
      setName("");
      setRawKey(null);
      setError(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Plus className="size-4" aria-hidden="true" />
          Nueva clave
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crear clave API</DialogTitle>
          <DialogDescription>
            La clave completa solo se muestra una vez. Guárdala en un lugar
            seguro; almacenamos únicamente el prefijo y un hash.
            {isDemo ? (
              <span className="mt-2 flex">
                <DemoBadge />
              </span>
            ) : null}
          </DialogDescription>
        </DialogHeader>

        {rawKey ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-amber-700" role="status">
              Copia esta clave ahora. No volverá a mostrarse.
            </p>
            <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
              {rawKey}
            </pre>
            <DialogFooter>
              <Button type="button" onClick={() => handleOpenChange(false)}>
                Cerrar
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="api-key-name">Nombre</Label>
              <Input
                id="api-key-name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Integración producción"
                required
                maxLength={120}
                autoComplete="off"
              />
            </div>
            {error ? (
              <p className="text-sm text-destructive" role="alert">
                {error}
              </p>
            ) : null}
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Creando…" : "Crear clave"}
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
