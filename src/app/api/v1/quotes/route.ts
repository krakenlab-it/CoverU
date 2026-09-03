import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export const GET = withApiV1(
  async ({ requestId, auth, searchParams }) => {
    if (!isSupabaseAdminConfigured()) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
    }

    const quoteId = searchParams.get("id");

    if (!quoteId) {
      return apiError(
        requestId,
        400,
        "missing_parameter",
        "Se requiere el parámetro id",
      );
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

    const { data: quote, error } = await supabase
      .from("quotes")
      .select(
        `
        *,
        plan_version:plan_versions (
          *,
          plan:plans (
            *,
            insurer:insurers (*)
          )
        ),
        tariff:tariffs (*)
      `,
      )
      .eq("id", quoteId)
      .maybeSingle();

    if (error) {
      return apiError(requestId, 500, "database_error", error.message);
    }

    if (!quote) {
      return apiError(requestId, 404, "not_found", "Cotización no encontrada");
    }

    if (
      quote.organization_id &&
      quote.organization_id !== auth.organizationId
    ) {
      return apiError(
        requestId,
        403,
        "forbidden",
        "No tienes acceso a esta cotización",
      );
    }

    return apiSuccess(requestId, { quote });
  },
  { requiredScope: "read:quotes" },
);
