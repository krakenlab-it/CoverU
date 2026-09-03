import { DEMO_BADGE_LABEL } from "@/lib/constants";

interface DemoBannerProps {
  compact?: boolean;
}

export function DemoBanner({ compact = false }: DemoBannerProps) {
  if (compact) {
    return (
      <div
        role="status"
        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900"
      >
        <strong>{DEMO_BADGE_LABEL}.</strong> No son productos ni precios reales.
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"
    >
      <p className="font-semibold">{DEMO_BADGE_LABEL}</p>
      <p className="mt-1">
        Todos los planes, precios y respuestas del asistente son datos de
        demostración. No representan productos de seguro reales ni cotizaciones
        vinculantes. La redacción de la póliza siempre prevalece.
      </p>
    </div>
  );
}
