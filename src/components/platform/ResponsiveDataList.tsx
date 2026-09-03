import { cn } from "@/lib/utils";

export type ResponsiveDataColumn<T> = {
  key: string;
  header: string;
  cell: (row: T) => React.ReactNode;
  mobileLabel?: string;
  className?: string;
};

type ResponsiveDataListProps<T> = {
  rows: T[];
  columns: ResponsiveDataColumn<T>[];
  getRowKey: (row: T) => string;
  caption?: string;
  className?: string;
  emptyMessage?: string;
};

export function ResponsiveDataList<T>({
  rows,
  columns,
  getRowKey,
  caption,
  className,
  emptyMessage = "Sin datos para mostrar",
}: ResponsiveDataListProps<T>) {
  if (rows.length === 0) {
    return (
      <p role="status" className="text-sm text-muted-foreground">
        {emptyMessage}
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto md:block">
        <table className={cn("w-full border-collapse text-sm", className)}>
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-border text-left">
              {columns.map((col) => (
                <th
                  key={col.key}
                  scope="col"
                  className={cn("px-3 py-2 font-semibold", col.className)}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr
                key={getRowKey(row)}
                className="border-b border-border/70 last:border-0"
              >
                {columns.map((col) => (
                  <td key={col.key} className={cn("px-3 py-3", col.className)}>
                    {col.cell(row)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="space-y-3 md:hidden" aria-label={caption ?? "Lista de datos"}>
        {rows.map((row) => (
          <li
            key={getRowKey(row)}
            className="rounded-xl border border-border bg-card p-4 shadow-sm"
          >
            <dl className="space-y-2">
              {columns.map((col) => (
                <div key={col.key} className="grid grid-cols-[minmax(0,40%)_1fr] gap-2">
                  <dt className="text-xs font-medium text-muted-foreground">
                    {col.mobileLabel ?? col.header}
                  </dt>
                  <dd className="text-sm text-foreground">{col.cell(row)}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ul>
    </>
  );
}
