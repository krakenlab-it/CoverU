"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppAreaError({
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
        message: "Unhandled /app error",
        digest: error.digest,
        timestamp: new Date().toISOString(),
      }),
    );
  }, [error]);

  return (
    <div className="rounded-2xl border border-red-200 bg-red-50 p-8 text-center">
      <h2 className="text-xl font-bold text-red-900">Error en el panel</h2>
      <p className="mt-2 text-sm text-red-800">
        No pudimos cargar esta sección del marketplace. Intenta de nuevo.
      </p>
      {error.digest && (
        <p className="mt-2 font-mono text-xs text-red-700">
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
          href="/app/marketplace"
          className="rounded-full border border-red-300 px-5 py-2 text-sm font-semibold text-red-900"
        >
          Volver al marketplace
        </Link>
      </div>
    </div>
  );
}
