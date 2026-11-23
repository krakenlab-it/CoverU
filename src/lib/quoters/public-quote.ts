import { getBundledCatalogDomain } from "@/lib/catalog/package";
import { buildQuotesFromCatalog, type CatalogQuoteInput } from "@/lib/quoters/quote";
import type { PublicQuoteResult, QuoteRequest } from "@/lib/quoters/types";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";

type TariffRow = Tariff & { plan: (Plan & { insurer: Insurer | null }) | null };

/** PostgREST caps responses at the project's max-rows setting; page through it. */
const SUPABASE_PAGE_SIZE = 1000;

async function readSupabaseCatalog(): Promise<CatalogQuoteInput | null> {
  const supabase = createAdminClient();
  if (!supabase) return null;

  const insurers = new Map<string, Insurer>();
  const plans = new Map<string, Plan>();
  const tariffs: Tariff[] = [];

  for (let from = 0; ; from += SUPABASE_PAGE_SIZE) {
    const { data, error } = await supabase
      .from("tariffs")
      .select("*, plan:plans!inner(*, insurer:insurers(*))")
      .eq("load_blocked", false)
      .eq("plans.status", "active")
      .order("id")
      .range(from, from + SUPABASE_PAGE_SIZE - 1);

    if (error) return null;

    const rows = (data ?? []) as TariffRow[];
    for (const row of rows) {
      const { plan, ...tariff } = row;
      if (!plan?.insurer) continue;

      insurers.set(plan.insurer.id, plan.insurer);
      plans.set(plan.id, plan);
      tariffs.push(tariff);
    }

    if (rows.length < SUPABASE_PAGE_SIZE) break;
  }

  if (tariffs.length === 0) return null;

  return {
    insurers: [...insurers.values()],
    plans: [...plans.values()],
    tariffs,
  };
}

/**
 * Public quoter data source, in priority order:
 * 1. Supabase published catalog when the service role env vars are configured.
 * 2. The v1.3 catalog package committed under `data/catalog/v1.3`, so `/comparar`
 *    serves real catalog data with Supabase unconfigured (CI and local).
 *
 * Returns null only when neither source has rows, and callers surface an
 * explicit "catalog unavailable" state rather than inventing plans.
 */
export async function getPublicQuote(
  request: QuoteRequest,
): Promise<PublicQuoteResult | null> {
  const remote = await readSupabaseCatalog();
  if (remote) {
    return buildQuotesFromCatalog(remote, request, "supabase");
  }

  const bundled = getBundledCatalogDomain();
  if (!bundled) return null;

  return buildQuotesFromCatalog(bundled, request, "bundled-catalog");
}
