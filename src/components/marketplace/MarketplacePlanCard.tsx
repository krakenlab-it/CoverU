import type { QuoteState } from "@/lib/marketplace/types";
import { formatCLP } from "@/lib/marketplace/format";
import { DEMO_BADGE_LABEL } from "@/lib/constants";
import Link from "next/link";

const QUOTE_LABELS: Record<QuoteState, string> = {
  quoted: "Cotización",
  indicative: "Precio indicativo (demo)",
  unavailable: "Sin tarifa para este perfil",
};

interface MarketplacePlanCardProps {
  planVersionId: string;
  planName: string;
  insurerName: string;
  isDemo: boolean;
  monthlyPrice: number | null;
  quoteState: QuoteState;
  coverageHighlights: string[];
  exclusionWarnings: string[];
  waitingPeriodWarnings: string[];
  isSelectedForCompare: boolean;
  compareDisabledReason?: string;
  detailHref: string;
  onToggleCompare: () => void;
}

export function MarketplacePlanCard({
  planVersionId,
  planName,
  insurerName,
  isDemo,
  monthlyPrice,
  quoteState,
  coverageHighlights,
  exclusionWarnings,
  waitingPeriodWarnings,
  isSelectedForCompare,
  compareDisabledReason,
  detailHref,
  onToggleCompare,
}: MarketplacePlanCardProps) {
  const compareDisabled = Boolean(compareDisabledReason) && !isSelectedForCompare;

  return (
    <article
      className="flex flex-col rounded-2xl border border-coveru-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
      aria-labelledby={`plan-${planVersionId}-title`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm text-coveru-gray">{insurerName}</p>
          <h3 id={`plan-${planVersionId}-title`} className="text-lg font-bold">
            {planName}
          </h3>
        </div>
        {isDemo && (
          <span
            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
            title={DEMO_BADGE_LABEL}
          >
            DEMO
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-coveru-light p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-coveru-gray">
          {QUOTE_LABELS[quoteState]}
        </p>
        {monthlyPrice != null ? (
          <p className="text-2xl font-bold text-coveru-red">
            {formatCLP(monthlyPrice)}
            <span className="text-sm font-normal text-coveru-gray">/mes</span>
          </p>
        ) : (
          <p className="text-sm text-coveru-gray">
            Ajusta edad, género o región para ver un precio de ejemplo.
          </p>
        )}
      </div>

      {coverageHighlights.length > 0 && (
        <ul className="mt-4 space-y-1 text-sm" aria-label="Coberturas destacadas">
          {coverageHighlights.map((item) => (
            <li key={item} className="flex items-start gap-2">
              <span className="text-emerald-600" aria-hidden="true">
                ✓
              </span>
              {item}
            </li>
          ))}
        </ul>
      )}

      {exclusionWarnings.length > 0 && (
        <div className="mt-3 rounded-lg border border-red-100 bg-red-50 p-3 text-xs text-red-800">
          <p className="font-semibold">Exclusiones a considerar</p>
          <ul className="mt-1 list-inside list-disc">
            {exclusionWarnings.slice(0, 2).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {waitingPeriodWarnings.length > 0 && (
        <div className="mt-2 rounded-lg border border-amber-100 bg-amber-50 p-3 text-xs text-amber-900">
          <p className="font-semibold">Períodos de carencia</p>
          <ul className="mt-1 list-inside list-disc">
            {waitingPeriodWarnings.slice(0, 2).map((w) => (
              <li key={w}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-auto flex flex-wrap gap-2 pt-4">
        <Link
          href={detailHref}
          className="inline-flex flex-1 items-center justify-center rounded-full border border-coveru-red px-4 py-2 text-sm font-semibold text-coveru-red hover:bg-coveru-red hover:text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
        >
          Ver póliza
        </Link>
        <button
          type="button"
          onClick={onToggleCompare}
          disabled={compareDisabled}
          aria-pressed={isSelectedForCompare}
          aria-label={
            isSelectedForCompare
              ? `Quitar ${planName} de la comparación`
              : `Agregar ${planName} a la comparación`
          }
          title={compareDisabled ? compareDisabledReason : undefined}
          className="inline-flex flex-1 items-center justify-center rounded-full bg-coveru-red px-4 py-2 text-sm font-semibold text-white hover:bg-coveru-red-dark disabled:cursor-not-allowed disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
        >
          {isSelectedForCompare ? "En comparación" : "Comparar"}
        </button>
      </div>
    </article>
  );
}
