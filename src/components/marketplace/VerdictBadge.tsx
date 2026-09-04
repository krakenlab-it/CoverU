import type { CoverageStatus } from "@/lib/types/phase1";

const VERDICT_CONFIG: Record<
  CoverageStatus,
  { label: string; className: string }
> = {
  covered: {
    label: "Cubierto",
    className: "bg-emerald-100 text-emerald-800 border-emerald-200",
  },
  not_covered: {
    label: "No cubierto",
    className: "bg-red-100 text-red-800 border-red-200",
  },
  conditional: {
    label: "Condicional",
    className: "bg-amber-100 text-amber-800 border-amber-200",
  },
  unknown: {
    label: "Sin respuesta",
    className: "bg-gray-100 text-gray-700 border-gray-200",
  },
  quoted: {
    label: "Cotizado",
    className: "bg-sky-100 text-sky-800 border-sky-200",
  },
};

interface VerdictBadgeProps {
  status: CoverageStatus;
  abstained?: boolean;
}

export function VerdictBadge({ status, abstained }: VerdictBadgeProps) {
  const config = VERDICT_CONFIG[status];
  const label = abstained ? "Sin respuesta en póliza" : config.label;

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${config.className}`}
      role="status"
    >
      {label}
    </span>
  );
}
