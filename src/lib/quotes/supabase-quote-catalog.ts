import { createAdminClient } from "@/lib/supabase/admin";
import type { QuoteCatalogPort, QuoteInsertRow } from "@/lib/quotes/quote-service";
import { parseQuoteVersionRefs } from "@/lib/quotes/version-pins";
import type { Tariff } from "@/lib/types/database";
import type { PlanVersion, Quote } from "@/lib/types/phase1";

const QUOTE_COLUMNS = [
  "id",
  "organization_id",
  "plan_version_id",
  "tariff_id",
  "tariff_version_id",
  "plan_conditions_version_id",
  "external_ref",
  "status",
  "age",
  "gender",
  "region",
  "monthly_price",
  "metadata",
  "expires_at",
  "is_demo",
  "created_at",
].join(", ");

export interface QuoteStoreError {
  message: string;
}

export type QuoteStoreResult<T> =
  | { ok: true; data: T }
  | { ok: false; error: QuoteStoreError };

function numberOrNull(value: unknown): number | null {
  if (value == null) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

/** Maps a quotes row, keeping legacy rows (null version pins) valid. */
export function toQuoteRow(row: Record<string, unknown>): Quote {
  const refs = parseQuoteVersionRefs(row);

  return {
    id: String(row.id),
    organization_id: row.organization_id == null ? null : String(row.organization_id),
    plan_version_id: String(row.plan_version_id),
    tariff_id: row.tariff_id == null ? null : String(row.tariff_id),
    tariff_version_id: refs?.tariffVersionId ?? null,
    plan_conditions_version_id: refs?.conditionsVersionId ?? null,
    external_ref: row.external_ref == null ? null : String(row.external_ref),
    status: String(row.status) as Quote["status"],
    age: numberOrNull(row.age),
    gender: row.gender == null ? null : String(row.gender),
    region: row.region == null ? null : String(row.region),
    monthly_price: numberOrNull(row.monthly_price),
    metadata:
      typeof row.metadata === "object" && row.metadata !== null
        ? (row.metadata as Record<string, unknown>)
        : {},
    expires_at: row.expires_at == null ? null : String(row.expires_at),
    is_demo: row.is_demo === true,
    created_at: String(row.created_at),
  };
}

class SupabaseQuoteCatalog implements QuoteCatalogPort {
  constructor(
    private readonly client: NonNullable<ReturnType<typeof createAdminClient>>,
  ) {}

  async getPlanVersion(id: string): Promise<PlanVersion | null> {
    const { data, error } = await this.client
      .from("plan_versions")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return data as PlanVersion;
  }

  async listTariffs(input: {
    planVersionId: string;
    planId: string;
  }): Promise<Tariff[]> {
    const byVersion = await this.client
      .from("tariffs")
      .select("*")
      .eq("plan_version_id", input.planVersionId);

    if (!byVersion.error && (byVersion.data ?? []).length > 0) {
      return byVersion.data as Tariff[];
    }

    const byPlan = await this.client
      .from("tariffs")
      .select("*")
      .eq("plan_id", input.planId);

    if (byPlan.error) return [];
    return (byPlan.data ?? []) as Tariff[];
  }

  async getQuote(id: string): Promise<Quote | null> {
    const { data, error } = await this.client
      .from("quotes")
      .select(QUOTE_COLUMNS)
      .eq("id", id)
      .maybeSingle();

    if (error || !data) return null;
    return toQuoteRow(data as unknown as Record<string, unknown>);
  }

  async insertQuote(row: QuoteInsertRow): Promise<Quote> {
    const { data, error } = await this.client
      .from("quotes")
      .insert(row)
      .select(QUOTE_COLUMNS)
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "quote insert returned no row");
    }

    return toQuoteRow(data as unknown as Record<string, unknown>);
  }
}

/**
 * Builds the quote catalog port over the service-role client. Returns null when Supabase is
 * not configured, so routes answer 503 the same way the other v1 endpoints do.
 */
export function createQuoteCatalog(): QuoteCatalogPort | null {
  const client = createAdminClient();
  if (!client) return null;
  return new SupabaseQuoteCatalog(client);
}
