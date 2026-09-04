/** Strip demo prefix from catalog display names in the authenticated app. */
export function formatCatalogDisplayName(name: string): string {
  return name.replace(/^\[DEMO\]\s*/i, "").trim();
}
