"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(
      JSON.stringify({
        level: "error",
        message: "Unhandled app error",
        digest: error.digest,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center px-4 py-16 text-center">
      <h1 className="text-2xl font-bold text-foreground">Algo salió mal</h1>
      <p className="mt-3 text-sm text-coveru-gray">
        Ocurrió un error inesperado. Puedes intentar de nuevo o volver al inicio.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-coveru-gray">
          Referencia: {error.digest}
        </p>
      )}
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-coveru-red px-5 py-2 text-sm font-semibold text-white"
        >
          Reintentar
        </button>
        <Link
          href="/"
          className="rounded-full border border-coveru-border px-5 py-2 text-sm font-semibold"
        >
          Ir al inicio
        </Link>
      </div>
    </div>
  );
}
