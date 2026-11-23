import { ResponsiveDataList } from "@/components/platform/ResponsiveDataList";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { FunnelDayCount, FunnelSummary } from "@/lib/dashboard/funnel";

type FunnelChartProps = {
  summary: FunnelSummary;
};

/**
 * Funnel counts as a proportional bar list. Rendered as list markup rather than
 * an image so a screen reader gets the same ordering and numbers as the visual
 * bar. Bars are scaled against the largest step, and every step is shown,
 * including honest zeroes.
 */
export function FunnelChart({ summary }: FunnelChartProps) {
  if (summary.isEmpty) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        Aún no hay eventos del embudo en los últimos {summary.windowDays} días.
      </p>
    );
  }

  const maxCount = Math.max(...summary.steps.map((entry) => entry.count), 0);

  return (
    <ul className="space-y-4" aria-label="Conteo del embudo">
      {summary.steps.map((entry) => {
        const width = maxCount === 0 ? 0 : (entry.count / maxCount) * 100;

        return (
          <li key={entry.step} className="space-y-1.5">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <span className="text-sm font-medium">{entry.label}</span>
              <span className="text-sm text-muted-foreground">
                <span className="text-base font-semibold text-foreground">
                  {entry.count}
                </span>{" "}
                {entry.count === 1 ? "evento" : "eventos"}
              </span>
            </div>
            <div
              className="h-2.5 w-full overflow-hidden rounded-full bg-muted"
              aria-hidden="true"
            >
              <div
                className={cn(
                  "h-full rounded-full bg-primary",
                  entry.count === 0 && "bg-transparent",
                )}
                style={{ width: `${width}%` }}
              />
            </div>
          </li>
        );
      })}
    </ul>
  );
}

type FunnelDayTableProps = {
  summary: FunnelSummary;
};

function formatDayLabel(isoDate: string): string {
  return new Date(`${isoDate}T12:00:00Z`).toLocaleDateString("es-EC", {
    day: "numeric",
    month: "short",
  });
}

/**
 * Per-day breakdown, most recent first. Uses the shared responsive list so the
 * narrow layout is a card list instead of a horizontally scrolling table.
 */
export function FunnelDayTable({ summary }: FunnelDayTableProps) {
  const rows = [...summary.byDay].reverse();

  return (
    <Card>
      <CardContent className="p-4">
        <ResponsiveDataList
          rows={rows}
          getRowKey={(row) => row.date}
          caption={`Eventos del embudo por día en los últimos ${summary.windowDays} días`}
          emptyMessage="Sin días en la ventana seleccionada."
          columns={[
            {
              key: "date",
              header: "Día",
              cell: (row: FunnelDayCount) => formatDayLabel(row.date),
            },
            ...summary.steps.map((step) => ({
              key: step.step,
              header: step.label,
              mobileLabel: step.label,
              className: "text-right tabular-nums",
              cell: (row: FunnelDayCount) => String(row.counts[step.step]),
            })),
          ]}
        />
      </CardContent>
    </Card>
  );
}
