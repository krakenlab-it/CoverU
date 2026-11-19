import {
  describeCoinsurance,
  describeCopay,
  describeCoverageCeiling,
  describeDeductible,
  describePaymentModality,
} from "@/lib/marketplace/plan-conditions";
import type { PlanConditions } from "@/lib/marketplace/plan-conditions";

interface ConditionRow {
  id: string;
  description: string;
  notes: string | null;
}

interface ConditionGroupProps {
  id: string;
  title: string;
  description: string;
  rows: ConditionRow[];
}

function ConditionGroup({ id, title, description, rows }: ConditionGroupProps) {
  if (rows.length === 0) return null;

  return (
    <section
      aria-labelledby={id}
      className="overflow-hidden rounded-2xl border border-coveru-border bg-white"
    >
      <div className="border-b border-coveru-border px-6 py-4">
        <h2 id={id} className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        <p className="mt-1 text-sm text-coveru-gray">{description}</p>
      </div>
      <ul className="divide-y divide-coveru-border px-6">
        {rows.map((row) => (
          <li
            key={row.id}
            className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 py-3"
          >
            <span className="text-sm font-medium text-foreground">
              {row.description}
            </span>
            {row.notes ? (
              <span className="max-w-md text-xs leading-relaxed text-coveru-gray">
                {row.notes}
              </span>
            ) : null}
          </li>
        ))}
      </ul>
    </section>
  );
}

interface PlanConditionsPanelProps {
  conditions: PlanConditions;
}

/**
 * Renders the plan conditions attached to a published plan version: deductibles,
 * coinsurance, copays, payment modality and coverage ceilings.
 */
export function PlanConditionsPanel({ conditions }: PlanConditionsPanelProps) {
  return (
    <>
      <ConditionGroup
        id="deductibles-heading"
        title="Deducibles"
        description="Monto que asume el asegurado antes de que el plan cubra el gasto."
        rows={conditions.deductibles.map((row) => ({
          id: row.id,
          description: describeDeductible(row),
          notes: row.notes,
        }))}
      />

      <ConditionGroup
        id="coinsurance-heading"
        title="Coaseguro"
        description="Porcentaje que cubre la aseguradora y porcentaje que paga el asegurado."
        rows={conditions.coinsurance.map((row) => ({
          id: row.id,
          description: describeCoinsurance(row),
          notes: row.notes,
        }))}
      />

      <ConditionGroup
        id="copays-heading"
        title="Copagos"
        description="Monto fijo por servicio, independiente del costo real."
        rows={conditions.copays.map((row) => ({
          id: row.id,
          description: describeCopay(row),
          notes: row.notes,
        }))}
      />

      <ConditionGroup
        id="ceilings-heading"
        title="Techos de cobertura"
        description="Monto máximo que el plan cubre según el ámbito indicado."
        rows={conditions.ceilings.map((row) => ({
          id: row.id,
          description: describeCoverageCeiling(row),
          notes: row.notes,
        }))}
      />

      <ConditionGroup
        id="payment-heading"
        title="Modalidad de pago"
        description="Medios y frecuencias de pago aceptados por la aseguradora."
        rows={conditions.paymentModalities.map((row) => ({
          id: row.id,
          description: describePaymentModality(row),
          notes: row.notes,
        }))}
      />
    </>
  );
}
