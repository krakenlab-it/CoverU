import { z } from "zod";
import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { canAccessOrganizationQuote } from "@/lib/api/quote-access";
import { apiDatabaseError } from "@/lib/api/response";
import { createQuote, quoteCreateSchema } from "@/lib/quotes/quote-service";
import { createQuoteCatalog } from "@/lib/quotes/supabase-quote-catalog";
import { createAdminClient } from "@/lib/supabase/admin";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

const quoteIdSchema = z.string().uuid();

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

    if (!quoteIdSchema.safeParse(quoteId).success) {
      return apiError(
        requestId,
        400,
        "validation_error",
        "El parámetro id debe ser un UUID",
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
      return apiDatabaseError(requestId, error);
    }

    if (!quote || !canAccessOrganizationQuote(quote.organization_id, auth.organizationId)) {
      return apiError(requestId, 404, "not_found", "Cotización no encontrada");
    }

    return apiSuccess(requestId, { quote });
  },
  { requiredScope: "read:quotes" },
);

export const POST = withApiV1(
  async ({ request, requestId, auth }) => {
    if (!isSupabaseAdminConfigured()) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(requestId, 400, "invalid_json", "Cuerpo JSON inválido");
    }

    const parsed = quoteCreateSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        requestId,
        400,
        "validation_error",
        "Parámetros inválidos",
        parsed.error.flatten(),
      );
    }

    const catalog = createQuoteCatalog();
    if (!catalog) {
      return apiError(
        requestId,
        503,
        "service_unavailable",
        "API no disponible: Supabase no está configurado",
      );
    }

    const result = await createQuote(
      catalog,
      auth.organizationId,
      parsed.data,
    );

    if (!result.ok) {
      return apiError(requestId, result.status, result.code, result.message);
    }

    const { quote, versionChange } = result;

    return apiSuccess(
      requestId,
      {
        quote,
        versions: {
          plan_version_id: quote.plan_version_id,
          plan_conditions_version_id: quote.plan_conditions_version_id,
          tariff_version_id: quote.tariff_version_id,
        },
        re_quote: versionChange,
      },
      { status: 201 },
    );
  },
  { requiredScope: "write:quotes" },
);
