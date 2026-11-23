import { z } from "zod";
import { TARIFF_GENDERS, TARIFF_REGIONS } from "@/lib/catalog-enums";
import { canRequoteQuote } from "@/lib/api/quote-access";
import { findMatchingTariff } from "@/lib/marketplace/tariff-match";
import { buildRequoteMetadata, diffQuoteVersionRefs, type QuoteVersionChange } from "@/lib/quotes/version-pins";
import type { Tariff } from "@/lib/types/database";
import type { PlanVersion, Quote } from "@/lib/types/phase1";

/**
 * Quote creation (KAN-231): every new quote is pinned to the tariff row and the
 * plan-conditions version it was priced with, so the proposal can be reproduced after a
 * new tariff load.
 */

const regionValues = TARIFF_REGIONS.map((region) => region.value);

export const quoteCreateSchema = z.object({
  plan_version_id: z.string().uuid(),
  age: z.number().int().min(0).max(120),
  gender: z.enum(TARIFF_GENDERS).optional(),
  region: z.enum(regionValues).optional(),
  grupo_asegurado: z.enum(["titular", "nino_solo"]).optional(),
  external_ref: z.string().trim().min(1).max(120).optional(),
  expires_at: z.string().datetime({ offset: true }).optional(),
  requote_of: z.string().uuid().optional(),
});

export type QuoteCreateInput = z.infer<typeof quoteCreateSchema>;

export interface QuoteInsertRow {
  organization_id: string;
  plan_version_id: string;
  tariff_id: string;
  tariff_version_id: string;
  plan_conditions_version_id: string;
  external_ref: string | null;
  status: "active";
  age: number;
  gender: string | null;
  region: string | null;
  monthly_price: number;
  metadata: Record<string, unknown>;
  expires_at: string | null;
  is_demo: boolean;
}

export interface QuoteCatalogPort {
  getPlanVersion(id: string): Promise<PlanVersion | null>;
  /** Tariffs of a plan version, falling back to the plan when the version link is unbacked. */
  listTariffs(input: { planVersionId: string; planId: string }): Promise<Tariff[]>;
  getQuote(id: string): Promise<Quote | null>;
  insertQuote(row: QuoteInsertRow): Promise<Quote>;
}

export type QuoteServiceFailure = {
  ok: false;
  status: number;
  code: string;
  message: string;
};

export type QuoteServiceResult =
  | {
      ok: true;
      quote: Quote;
      versionChange: QuoteVersionChange | null;
    }
  | QuoteServiceFailure;

function failure(
  status: number,
  code: string,
  message: string,
): QuoteServiceFailure {
  return { ok: false, status, code, message };
}

/** Picks the tariff row for a quote and refuses to quote a plan with no matching price. */
export function selectQuoteTariff(
  tariffs: Tariff[],
  input: Pick<QuoteCreateInput, "age" | "gender" | "region">,
): Tariff | null {
  return findMatchingTariff(tariffs, {
    age: input.age,
    gender: input.gender,
    region: input.region,
  });
}

export interface QuotePricingSnapshot {
  tariff_id: string;
  monthly_price: number;
  age_min: number;
  age_max: number;
  gender: string;
  region: string;
  grupo_asegurado: string | null;
  deductible: number | null;
  annual_limit: number | null;
}

function pricingSnapshot(tariff: Tariff): QuotePricingSnapshot {
  return {
    tariff_id: tariff.id,
    monthly_price: tariff.monthly_price,
    age_min: tariff.age_min,
    age_max: tariff.age_max,
    gender: tariff.gender,
    region: String(tariff.region),
    grupo_asegurado: tariff.grupo_asegurado ?? null,
    deductible: tariff.deductible,
    annual_limit: tariff.annual_limit,
  };
}

export function buildQuoteInsert(
  organizationId: string,
  version: PlanVersion,
  tariff: Tariff,
  input: QuoteCreateInput,
  requote?: { previous: Quote; change: QuoteVersionChange },
): QuoteInsertRow {
  const baseMetadata: Record<string, unknown> = {
    source: "api_v1",
    pricing_snapshot: pricingSnapshot(tariff),
    versions: {
      tariff_version_id: tariff.id,
      plan_conditions_version_id: version.id,
    },
  };

  return {
    organization_id: organizationId,
    plan_version_id: version.id,
    tariff_id: tariff.id,
    tariff_version_id: tariff.id,
    plan_conditions_version_id: version.id,
    external_ref: input.external_ref ?? null,
    status: "active",
    age: input.age,
    gender: input.gender ?? null,
    region: input.region ?? null,
    monthly_price: tariff.monthly_price,
    metadata: requote
      ? buildRequoteMetadata(
          { ...requote.previous, metadata: baseMetadata },
          requote.change,
        )
      : baseMetadata,
    expires_at: input.expires_at ?? null,
    is_demo: false,
  };
}

/**
 * Creates a quote pinned to the current tariff and conditions version. With `requote_of`,
 * the stored quote is diffed against the current catalog and the replacement quote records
 * the bump; the original quote is never modified, so its pins stay the record of what was
 * actually quoted.
 */
export async function createQuote(
  port: QuoteCatalogPort,
  organizationId: string,
  input: QuoteCreateInput,
): Promise<QuoteServiceResult> {
  const version = await port.getPlanVersion(input.plan_version_id);
  if (!version) {
    return failure(404, "not_found", "Versión de plan no encontrada");
  }

  if (version.status !== "published") {
    return failure(404, "not_found", "Versión de plan no publicada");
  }

  const tariffs = await port.listTariffs({
    planVersionId: version.id,
    planId: version.plan_id,
  });
  const tariff = selectQuoteTariff(tariffs, input);
  if (!tariff) {
    return failure(
      422,
      "tariff_not_found",
      "No hay tarifa vigente para la edad, género y región indicados",
    );
  }

  let requote: { previous: Quote; change: QuoteVersionChange } | undefined;
  if (input.requote_of) {
    const previous = await port.getQuote(input.requote_of);
    if (!previous || !canRequoteQuote(previous, organizationId)) {
      return failure(404, "not_found", "Cotización original no encontrada");
    }

    requote = {
      previous,
      change: diffQuoteVersionRefs(previous, { tariff, version }),
    };
  }

  const quote = await port.insertQuote(
    buildQuoteInsert(organizationId, version, tariff, input, requote),
  );

  return { ok: true, quote, versionChange: requote?.change ?? null };
}
