import { getCategoryLabel } from "@/lib/marketplace/catalog";
import { formatCLP, formatDate } from "@/lib/marketplace/format";
import { WAITING_PERIOD_LABELS } from "@/lib/marketplace/categories";
import type { ComparePlanEntry } from "@/lib/marketplace/types";
import type {
  CoverageClause,
  Exclusion,
  WaitingPeriod,
} from "@/lib/types/phase1";
import { VerdictBadge } from "@/components/marketplace/VerdictBadge";
import Link from "next/link";
import { EmptyState } from "@/components/platform/EmptyState";

interface CompareMatrixProps {
  entries: ComparePlanEntry[];
  clausesByPlan: Record<string, CoverageClause[]>;
  exclusionsByPlan: Record<string, Exclusion[]>;
  waitingByPlan: Record<string, WaitingPeriod[]>;
  filtersQuery: string;
}

function MatrixRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <tr className="border-b border-coveru-border">
      <th
        scope="row"
        className="sticky left-0 z-10 bg-white p-3 text-left text-sm font-semibold text-coveru-gray"
      >
        {label}
      </th>
      {children}
    </tr>
  );
}

export function CompareMatrix({
  entries,
  clausesByPlan,
  exclusionsByPlan,
  waitingByPlan,
  filtersQuery,
}: CompareMatrixProps) {
  if (entries.length < 2) {
    return (
      <EmptyState
        title="Selecciona al menos 2 planes para comparar"
        description="Agrega planes desde el marketplace y vuelve aquí para ver la comparación."
        actionLabel="Volver al marketplace"
        actionHref={`/app/marketplace${filtersQuery}`}
      />
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-coveru-border bg-white">
      <table className="min-w-full border-collapse text-sm" aria-label="Comparación de planes">
        <caption className="sr-only">
          Tabla comparativa de planes de seguro seleccionados
        </caption>
        <thead>
          <tr className="border-b border-coveru-border bg-coveru-light">
            <th scope="col" className="sticky left-0 z-10 bg-coveru-light p-3 text-left">
              Criterio
            </th>
            {entries.map((e) => (
              <th key={e.planVersionId} scope="col" className="min-w-[200px] p-3 text-left">
                <p className="text-xs text-coveru-gray">{e.insurer.name}</p>
                <p className="font-bold">{e.plan.name}</p>
                <Link
                  href={`/app/marketplace/plans/${e.planVersionId}${filtersQuery}`}
                  className="mt-1 inline-block text-xs font-semibold text-coveru-red"
                >
                  Ver póliza
                </Link>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <MatrixRow label="Precio mensual">
            {entries.map((e) => (
              <td key={e.planVersionId} className="p-3 align-top">
                {e.monthlyPrice != null ? (
                  <>
                    <span className="text-lg font-bold text-coveru-red">
                      {formatCLP(e.monthlyPrice)}
                    </span>
                    <p className="text-xs text-coveru-gray">
                      {e.quoteState === "indicative"
                        ? "Indicativo (demo)"
                        : e.quoteState === "quoted"
                          ? "Cotización"
                          : "Sin tarifa"}
                    </p>
                  </>
                ) : (
                  <span className="text-coveru-gray">—</span>
                )}
              </td>
            ))}
          </MatrixRow>

          <MatrixRow label="Deducible">
            {entries.map((e) => (
              <td key={e.planVersionId} className="p-3 align-top">
                {e.tariff?.deductible != null
                  ? formatCLP(e.tariff.deductible)
                  : "—"}
              </td>
            ))}
          </MatrixRow>

          <MatrixRow label="Copago">
            {entries.map((e) => (
              <td key={e.planVersionId} className="p-3 align-top">
                {e.tariff?.copay_pct != null ? `${e.tariff.copay_pct}%` : "—"}
              </td>
            ))}
          </MatrixRow>

          <MatrixRow label="Versión / vigencia">
            {entries.map((e) => (
              <td key={e.planVersionId} className="p-3 align-top">
                <p>{e.planVersion.label ?? `v${e.planVersion.version_number}`}</p>
                <p className="text-xs text-coveru-gray">
                  Desde {formatDate(e.planVersion.effective_from)}
                </p>
              </td>
            ))}
          </MatrixRow>

          <MatrixRow label="Beneficios">
            {entries.map((e) => {
              const clauses = clausesByPlan[e.planVersionId] ?? [];
              return (
                <td key={e.planVersionId} className="p-3 align-top">
                  <ul className="space-y-2">
                    {clauses.map((c) => (
                      <li key={c.id}>
                        <div className="flex flex-wrap items-center gap-1">
                          <span className="font-medium">{c.title}</span>
                          <VerdictBadge status={c.coverage_status} />
                        </div>
                        <p className="text-xs text-coveru-gray">
                          {getCategoryLabel(c.category)}
                        </p>
                      </li>
                    ))}
                  </ul>
                </td>
              );
            })}
          </MatrixRow>

          <MatrixRow label="Exclusiones">
            {entries.map((e) => {
              const exclusions = exclusionsByPlan[e.planVersionId] ?? [];
              return (
                <td key={e.planVersionId} className="p-3 align-top">
                  <ul className="list-inside list-disc space-y-1 text-xs">
                    {exclusions.map((x) => (
                      <li key={x.id}>{x.title}</li>
                    ))}
                    {(e.tariff?.exclusions ?? []).map((x) => (
                      <li key={x}>{x}</li>
                    ))}
                  </ul>
                </td>
              );
            })}
          </MatrixRow>

          <MatrixRow label="Carencias">
            {entries.map((e) => {
              const waiting = waitingByPlan[e.planVersionId] ?? [];
              return (
                <td key={e.planVersionId} className="p-3 align-top">
                  <ul className="space-y-1 text-xs">
                    {waiting.map((w) => (
                      <li key={w.id}>
                        {WAITING_PERIOD_LABELS[w.service_category] ??
                          w.service_category}
                        : {w.days} días
                      </li>
                    ))}
                  </ul>
                </td>
              );
            })}
          </MatrixRow>
        </tbody>
      </table>
    </div>
  );
}
