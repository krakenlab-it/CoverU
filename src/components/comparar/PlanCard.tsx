import { DEMO_BADGE_LABEL } from "@/lib/constants";
import type { ComparisonResult } from "@/lib/types/database";

function formatCLP(amount: number): string {
  return new Intl.NumberFormat("es-CL", {
    style: "currency",
    currency: "CLP",
    maximumFractionDigits: 0,
  }).format(amount);
}

interface PlanCardProps {
  result: ComparisonResult;
}

export function PlanCard({ result }: PlanCardProps) {
  const { tariff, plan, insurer } = result;

  return (
    <article
      className="rounded-2xl border border-coveru-border bg-white p-6 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-medium text-coveru-gray">{insurer.name}</p>
          <h3 className="mt-1 text-lg font-bold text-foreground">{plan.name}</h3>
        </div>
        {tariff.is_demo && (
          <span
            className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800"
            title={DEMO_BADGE_LABEL}
          >
            {DEMO_BADGE_LABEL}
          </span>
        )}
      </div>

      <div className="mt-4 rounded-xl bg-coveru-light p-4">
        <p className="text-sm text-coveru-gray">Tú pagas</p>
        <p className="text-3xl font-bold text-coveru-red">
          {formatCLP(tariff.monthly_price)}
          <span className="text-base font-normal text-coveru-gray">/mes</span>
        </p>
      </div>

      {plan.coverage_summary && (
        <p className="mt-4 text-sm text-foreground/80">{plan.coverage_summary}</p>
      )}

      <dl className="mt-4 grid gap-2 text-sm sm:grid-cols-2">
        {tariff.deductible != null && (
          <div>
            <dt className="text-coveru-gray">Deducible anual</dt>
            <dd className="font-medium">{formatCLP(tariff.deductible)}</dd>
          </div>
        )}
        {tariff.copay_pct != null && (
          <div>
            <dt className="text-coveru-gray">Copago</dt>
            <dd className="font-medium">{tariff.copay_pct}%</dd>
          </div>
        )}
        {tariff.annual_limit != null && (
          <div>
            <dt className="text-coveru-gray">Tope anual</dt>
            <dd className="font-medium">{formatCLP(tariff.annual_limit)}</dd>
          </div>
        )}
      </dl>

      <details className="mt-4 group" aria-label="Detalles del plan">
        <summary
          className="cursor-pointer text-sm font-semibold text-coveru-red hover:text-coveru-red-dark"
        >
          Ver detalles del plan
        </summary>
        <div className="mt-3 space-y-3 text-sm text-foreground/80">
          {plan.description && <p>{plan.description}</p>}
          {tariff.exclusions && tariff.exclusions.length > 0 && (
            <div>
              <p className="font-semibold text-foreground">Exclusiones</p>
              <ul className="mt-1 list-inside list-disc space-y-1">
                {tariff.exclusions.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs text-coveru-gray">
            Tarifa para edad {tariff.age_min}–{tariff.age_max}, región{" "}
            {tariff.region}, género {tariff.gender}.
          </p>
        </div>
      </details>
    </article>
  );
}
