import type { ComparisonResult, Insurer, Plan, Tariff } from "@/lib/types/database";
import { filterDemoResults } from "@/lib/demo-data";
import { createClient } from "@/lib/supabase/server";

export interface ComparisonParams {
  age: number;
  gender: string;
  region: string;
}

export async function getComparisonResults(
  params: ComparisonParams,
): Promise<ComparisonResult[]> {
  const supabase = await createClient();

  if (!supabase) {
    return filterDemoResults(params.age, params.gender, params.region);
  }

  const { data: tariffs, error } = await supabase
    .from("tariffs")
    .select(
      `
      *,
      plan:plans (
        *,
        insurer:insurers (*)
      )
    `,
    )
    .lte("age_min", params.age)
    .gte("age_max", params.age)
    .in("gender", [params.gender, "any"])
    .in("region", [params.region, "any"])
    .order("monthly_price", { ascending: true });

  if (error || !tariffs || tariffs.length === 0) {
    return filterDemoResults(params.age, params.gender, params.region);
  }

  const results: ComparisonResult[] = [];

  for (const tariff of tariffs) {
    const plan = tariff.plan as ComparisonResult["plan"] | null;
    if (!plan) continue;

    const insurer = plan.insurer as ComparisonResult["insurer"] | undefined;
    if (!insurer) continue;

    results.push({
      tariff: tariff as Tariff,
      plan: plan as Plan,
      insurer: insurer as Insurer,
    });
  }

  return results;
}
