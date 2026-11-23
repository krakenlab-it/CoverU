/** Quotes with a missing organization are not readable by any tenant. */
export function canAccessOrganizationQuote(
  quoteOrganizationId: string | null | undefined,
  organizationId: string,
): boolean {
  return quoteOrganizationId != null && quoteOrganizationId === organizationId;
}

/**
 * A quote can only be re-quoted by the tenant that owns it, and only while it is still a
 * live offer. Accepted/cancelled quotes are closed business and drafts were never sent out,
 * so neither is a valid re-quote source.
 */
export function canRequoteQuote(
  quote: { organization_id: string | null; status: string },
  organizationId: string,
): boolean {
  if (!canAccessOrganizationQuote(quote.organization_id, organizationId)) {
    return false;
  }

  return quote.status === "active" || quote.status === "expired";
}
