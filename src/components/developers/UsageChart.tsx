import type { UsageByDay } from "@/lib/dashboard/analytics";

type UsageChartProps = {
  data: UsageByDay[];
  label?: string;
};

function formatDayLabel(isoDate: string): string {
  const date = new Date(`${isoDate}T12:00:00`);
  return date.toLocaleDateString("es-EC", {
    weekday: "short",
    day: "numeric",
  });
}

export function UsageChart({
  data,
  label = "Solicitudes por día (últimos 7 días)",
}: UsageChartProps) {
  const maxCount = Math.max(...data.map((entry) => entry.count), 1);

  return (
    <div aria-label={label}>
      <p className="mb-4 text-sm font-semibold">{label}</p>
      {data.every((entry) => entry.count === 0) ? (
        <p className="text-sm text-muted-foreground">
          Aún no hay solicitudes registradas en los últimos 7 días.
        </p>
      ) : (
        <div
          className="flex h-40 items-end gap-2"
          role="img"
          aria-label={`Gráfico de ${label.toLowerCase()}`}
        >
          {data.map((entry) => (
            <div
              key={entry.date}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span className="text-xs font-medium text-muted-foreground">
                {entry.count}
              </span>
              <div
                className="w-full rounded-t-md bg-primary/80"
                style={{
                  height: `${Math.max((entry.count / maxCount) * 100, entry.count > 0 ? 8 : 0)}%`,
                }}
                title={`${formatDayLabel(entry.date)}: ${entry.count} solicitudes`}
              />
              <span className="truncate text-[10px] text-muted-foreground">
                {formatDayLabel(entry.date)}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
