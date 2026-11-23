import { z } from "zod";
import type { Tariff } from "@/lib/types/database";
import type { PlanVersion, Quote } from "@/lib/types/phase1";

/**
 * Quote version pins (KAN-231). A quote records the exact tariff row and the exact
 * plan-conditions version it was priced with, so the proposal can be reproduced after a
 * new tariff load or a conditions version bump.
 *
 * Legacy quotes (created before the columns existed) are nullable: an unpinned quote is
 * still a valid historical row, it just cannot be replayed row-for-row.
 */

export const quoteVersionRefsRowSchema = z.object({
  tariff_version_id: z.string().uuid().nullable(),
  plan_conditions_version_id: z.string().uuid().nullable(),
});

export type QuoteVersionRefsRow = z.infer<typeof quoteVersionRefsRowSchema>;

export interface QuoteVersionRefs {
  tariffVersionId: string | null;
  conditionsVersionId: string | null;
}

export function parseQuoteVersionRefs(row: unknown): QuoteVersionRefs | null {
  const parsed = quoteVersionRefsRowSchema.safeParse(row);
  if (!parsed.success) return null;

  return {
    tariffVersionId: parsed.data.tariff_version_id,
    conditionsVersionId: parsed.data.plan_conditions_version_id,
  };
}

export interface QuotePricing {
  tariff: Tariff;
  version: PlanVersion;
}

export interface QuoteVersionSnapshot {
  tariffVersionId: string | null;
  conditionsVersionId: string | null;
  monthlyPrice: number | null;
}

export interface QuoteVersionChange {
  changed: boolean;
  tariffChanged: boolean;
  conditionsChanged: boolean;
  priceChanged: boolean;
  previous: QuoteVersionSnapshot;
  next: QuoteVersionSnapshot;
}

function snapshotOfPricedQuote(pricing: QuotePricing): QuoteVersionSnapshot {
  return {
    tariffVersionId: pricing.tariff.id,
    conditionsVersionId: pricing.version.id,
    monthlyPrice: pricing.tariff.monthly_price,
  };
}

function snapshotOfQuote(quote: Quote): QuoteVersionSnapshot {
  return {
    tariffVersionId: quote.tariff_version_id,
    conditionsVersionId: quote.plan_conditions_version_id,
    monthlyPrice: quote.monthly_price,
  };
}

/**
 * Compares a stored quote with a fresh price from the current catalog. A bump in the
 * tariff price, in the matched tariff row, or in the conditions version all count as a
 * change; an unchanged catalog reproduces the original quote exactly.
 */
export function diffQuoteVersionRefs(
  previous: Quote,
  next: QuotePricing,
): QuoteVersionChange {
  const before = snapshotOfQuote(previous);
  const after = snapshotOfPricedQuote(next);

  const tariffChanged = before.tariffVersionId !== after.tariffVersionId;
  const conditionsChanged = before.conditionsVersionId !== after.conditionsVersionId;
  const priceChanged = before.monthlyPrice !== after.monthlyPrice;

  return {
    changed: tariffChanged || conditionsChanged || priceChanged,
    tariffChanged,
    conditionsChanged,
    priceChanged,
    previous: before,
    next: after,
  };
}

/**
 * Metadata written on the replacement quote. The original quote stays untouched so its
 * pins and price remain the record of what the customer was actually shown.
 */
export function buildRequoteMetadata(
  previous: Quote,
  change: QuoteVersionChange,
): Record<string, unknown> {
  return {
    ...previous.metadata,
    source: "api_v1_requote",
    re_quote_of: previous.id,
    previous_versions: {
      tariff_version_id: change.previous.tariffVersionId,
      plan_conditions_version_id: change.previous.conditionsVersionId,
      monthly_price: change.previous.monthlyPrice,
    },
    version_bump: {
      tariff_changed: change.tariffChanged,
      conditions_changed: change.conditionsChanged,
      price_changed: change.priceChanged,
    },
  };
}
