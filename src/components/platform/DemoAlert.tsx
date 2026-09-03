import { DEMO_BADGE_LABEL } from "@/lib/constants";
import { cn } from "@/lib/utils";

type DemoAlertProps = {
  compact?: boolean;
  className?: string;
};

export function DemoAlert({ compact = false, className }: DemoAlertProps) {
  if (compact) {
    return (
      <div
        role="status"
        className={cn(
          "rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950",
          className,
        )}
      >
        <strong>{DEMO_BADGE_LABEL}.</strong> No son productos ni precios reales.
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      className={cn(
        "rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950",
        className,
      )}
    >
      <p className="font-semibold">{DEMO_BADGE_LABEL}</p>
      <p className="mt-1">
        Todos los planes, precios y respuestas del asistente son datos de
        demostración. No representan productos de seguro reales ni cotizaciones
        vinculantes en Ecuador. La redacción de la póliza siempre prevalece.
      </p>
    </div>
  );
}
