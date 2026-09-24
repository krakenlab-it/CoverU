/** Ecuador uses US dollars. Premiums are stored as USD, not CLP. */
export function formatUsd(amount: number): string {
  return new Intl.NumberFormat("es-EC", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function formatDate(date: string | null): string {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-EC", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}
