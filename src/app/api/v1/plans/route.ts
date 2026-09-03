import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { paginate, parsePaginationParams } from "@/lib/api/response";
import { DEMO_INSURERS, DEMO_PLANS } from "@/lib/demo-api-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withApiV1(
  async ({ requestId, searchParams }) => {
    const { page, perPage } = parsePaginationParams(searchParams);
    const insurerId = searchParams.get("insurer_id");
    const status = searchParams.get("status") ?? "active";
    const isDemo = searchParams.get("is_demo");

    const supabase = createAdminClient();

    if (!supabase) {
      let items = DEMO_PLANS.map((plan) => ({
        ...plan,
        insurer: DEMO_INSURERS.find((i) => i.id === plan.insurer_id),
      }));

      if (insurerId) {
        items = items.filter((p) => p.insurer_id === insurerId);
      }
      if (isDemo === "true") items = items.filter((p) => p.is_demo);
      if (isDemo === "false") items = items.filter((p) => !p.is_demo);

      const { items: paged, meta } = paginate(items, page, perPage);
      return apiSuccess(requestId, { plans: paged, meta });
    }

    let query = supabase
      .from("plans")
      .select("*, insurer:insurers(*)", { count: "exact" });

    if (insurerId) query = query.eq("insurer_id", insurerId);
    if (status) query = query.eq("status", status);
    if (isDemo === "true") query = query.eq("is_demo", true);
    if (isDemo === "false") query = query.eq("is_demo", false);

    const from = (page - 1) * perPage;
    const to = from + perPage - 1;

    const { data, error, count } = await query
      .order("name")
      .range(from, to);

    if (error) {
      return apiError(requestId, 500, "database_error", error.message);
    }

    return apiSuccess(requestId, {
      plans: data ?? [],
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
