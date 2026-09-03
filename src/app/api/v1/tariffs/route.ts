import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { paginate, parsePaginationParams } from "@/lib/api/response";
import { DEMO_PLANS, DEMO_TARIFFS } from "@/lib/demo-api-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withApiV1(
  async ({ requestId, searchParams }) => {
    const { page, perPage } = parsePaginationParams(searchParams);
    const planId = searchParams.get("plan_id");
    const region = searchParams.get("region");
    const gender = searchParams.get("gender");
    const age = searchParams.get("age");

    const supabase = createAdminClient();

    if (!supabase) {
      let items = DEMO_TARIFFS.map((tariff) => ({
        ...tariff,
        plan: DEMO_PLANS.find((p) => p.id === tariff.plan_id),
      }));

      if (planId) items = items.filter((t) => t.plan_id === planId);
      if (region) {
        items = items.filter(
          (t) => t.region === region || t.region === "any",
        );
      }
      if (gender) {
        items = items.filter(
          (t) => t.gender === gender || t.gender === "any",
        );
      }
      if (age) {
        const ageNum = Number(age);
        items = items.filter(
          (t) => ageNum >= t.age_min && ageNum <= t.age_max,
        );
      }

      const { items: paged, meta } = paginate(items, page, perPage);
      return apiSuccess(requestId, { tariffs: paged, meta });
    }

    let query = supabase
      .from("tariffs")
      .select("*, plan:plans(*)", { count: "exact" });

    if (planId) query = query.eq("plan_id", planId);
    if (region) query = query.in("region", [region, "any"]);
    if (gender) query = query.in("gender", [gender, "any"]);
    if (age) {
      const ageNum = Number(age);
      query = query.lte("age_min", ageNum).gte("age_max", ageNum);
    }

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await query
      .order("monthly_price")
      .range(from, to);

    if (error) {
      return apiError(requestId, 500, "database_error", error.message);
    }

    return apiSuccess(requestId, {
      tariffs: data ?? [],
      meta: {
        page,
        per_page: perPage,
        total: count ?? 0,
        total_pages: Math.max(1, Math.ceil((count ?? 0) / perPage)),
      },
    });
  },
  { requiredScope: "read:catalog" },
);
