const STORAGE_KEY = "coveru-asistente-plan-favorites";

/** Favorites are stored in localStorage (no server-side favorites API yet). */
export function readPlanFavorites(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((id): id is string => typeof id === "string" && id.length > 0);
  } catch {
    return [];
  }
}

export function writePlanFavorites(planVersionIds: string[]): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(planVersionIds));
}

export function togglePlanFavorite(planVersionId: string): string[] {
  const current = readPlanFavorites();
  const next = current.includes(planVersionId)
    ? current.filter((id) => id !== planVersionId)
    : [...current, planVersionId];
  writePlanFavorites(next);
  return next;
}

export function isPlanFavorite(
  planVersionId: string,
  favorites: string[],
): boolean {
  return favorites.includes(planVersionId);
}
