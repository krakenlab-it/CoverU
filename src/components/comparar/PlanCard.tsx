import { DemoBadge } from "@/components/platform/DemoBadge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ComparisonResult } from "@/lib/types/database";
import { getRegionLabel } from "@/lib/regions";
import { formatCLP } from "@/lib/marketplace/format";
import { motion } from "@/lib/motion";

interface PlanCardProps {
  result: ComparisonResult;
}

export function PlanCard({ result }: PlanCardProps) {
  const { tariff, plan, insurer } = result;

  return (
    <Card className={motion.cardHover}>
      <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{insurer.name}</p>
          <CardTitle className="text-lg">{plan.name}</CardTitle>
        </div>
        {tariff.is_demo ? <DemoBadge /> : null}
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-sm text-muted-foreground">Tú pagas</p>
          <p className="text-3xl font-bold text-primary">
            {formatCLP(tariff.monthly_price)}
            <span className="text-base font-normal text-muted-foreground">/mes</span>
          </p>
        </div>

        {plan.coverage_summary ? (
          <p className="text-sm text-foreground/80">{plan.coverage_summary}</p>
        ) : null}

        <dl className="grid gap-2 text-sm sm:grid-cols-2">
          {tariff.deductible != null ? (
            <div>
              <dt className="text-muted-foreground">Deducible anual</dt>
              <dd className="font-medium">{formatCLP(tariff.deductible)}</dd>
            </div>
          ) : null}
          {tariff.copay_pct != null ? (
            <div>
              <dt className="text-muted-foreground">Copago</dt>
              <dd className="font-medium">{tariff.copay_pct}%</dd>
            </div>
          ) : null}
          {tariff.annual_limit != null ? (
            <div>
              <dt className="text-muted-foreground">Tope anual</dt>
              <dd className="font-medium">{formatCLP(tariff.annual_limit)}</dd>
            </div>
          ) : null}
        </dl>

        <details className="group" aria-label="Detalles del plan">
          <summary className="cursor-pointer text-sm font-semibold text-primary hover:underline">
            Ver detalles del plan
          </summary>
          <div className="mt-3 space-y-3 text-sm text-foreground/80">
            {plan.description ? <p>{plan.description}</p> : null}
            {tariff.exclusions && tariff.exclusions.length > 0 ? (
              <div>
                <p className="font-semibold text-foreground">Exclusiones</p>
                <ul className="mt-1 list-inside list-disc space-y-1">
                  {tariff.exclusions.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            <p className="text-xs text-muted-foreground">
              Tarifa para edad {tariff.age_min}–{tariff.age_max},{" "}
              {getRegionLabel(tariff.region)}, género {tariff.gender}.
            </p>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
