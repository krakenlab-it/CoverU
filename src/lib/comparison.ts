import type { ComparisonResult } from "@/lib/types/database";
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
      tariff: {
        id: tariff.id,
        plan_id: tariff.plan_id,
        age_min: tariff.age_min,
        age_max: tariff.age_max,
        gender: tariff.gender,
        region: tariff.region,
        monthly_price: tariff.monthly_price,
        deductible: tariff.deductible,
        copay_pct: tariff.copay_pct,
        annual_limit: tariff.annual_limit,
        exclusions: tariff.exclusions,
        is_demo: tariff.is_demo,
        created_at: tariff.created_at,
      },
      plan: {
        id: plan.id,
        insurer_id: plan.insurer_id,
        name: plan.name,
        description: plan.description,
        coverage_summary: plan.coverage_summary,
        is_demo: plan.is_demo,
        created_at: plan.created_at,
      },
      insurer: {
        id: insurer.id,
        name: insurer.name,
        slug: insurer.slug,
        logo_url: insurer.logo_url,
        is_demo: insurer.is_demo,
        created_at: insurer.created_at,
      },
    });
  }

  return results;
}
