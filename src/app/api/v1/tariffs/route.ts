import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { parsePaginationParams } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export const GET = withApiV1(
  async (ctx) => {
    const { requestId, searchParams } = ctx;
    if (!isSupabaseAdminConfigured()) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
    }

    const { page, perPage } = parsePaginationParams(searchParams);
    const planId = searchParams.get("plan_id");
    const region = searchParams.get("region");
    const gender = searchParams.get("gender");
    const age = searchParams.get("age");

    if (planId) {
      ctx.usageMetadata = {
        planId,
        metadata: {
          route: "tariffs",
          region,
          gender,
          age,
        },
      };
    } else {
      ctx.usageMetadata = {
        metadata: {
          route: "tariffs",
          region,
          gender,
          age,
        },
      };
    }

    const supabase = createAdminClient();
    if (!supabase) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
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
