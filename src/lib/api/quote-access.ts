/** Quotes with a missing organization are not readable by any tenant. */
export function canAccessOrganizationQuote(
  quoteOrganizationId: string | null | undefined,
  organizationId: string,
): boolean {
  return quoteOrganizationId != null && quoteOrganizationId === organizationId;
}
