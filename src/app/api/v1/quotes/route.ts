import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { getDemoQuote } from "@/lib/demo-api-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withApiV1(
  async ({ requestId, auth, searchParams }) => {
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
      const quote = getDemoQuote(quoteId, auth.organizationId);
      if (!quote) {
        return apiError(requestId, 404, "not_found", "Cotización no encontrada");
      }
      return apiSuccess(requestId, { quote });
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
