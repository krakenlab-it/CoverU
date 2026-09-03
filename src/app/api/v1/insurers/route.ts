import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { parsePaginationParams } from "@/lib/api/response";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export const GET = withApiV1(
  async ({ requestId, searchParams }) => {
    if (!isSupabaseAdminConfigured()) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
    }

    const { page, perPage } = parsePaginationParams(searchParams);
    const isDemo = searchParams.get("is_demo");

    const supabase = createAdminClient();
    if (!supabase) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
    }

    let query = supabase.from("insurers").select("*", { count: "exact" });

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
      insurers: data ?? [],
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
