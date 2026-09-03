import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { getDemoPlanVersionDetail } from "@/lib/demo-api-data";
import { createAdminClient } from "@/lib/supabase/admin";

export const GET = withApiV1(
  async ({ requestId, searchParams }) => {
    const versionId = searchParams.get("id");

    if (!versionId) {
      return apiError(
        requestId,
        400,
        "missing_parameter",
        "Se requiere el parámetro id",
      );
    }

    const supabase = createAdminClient();

    if (!supabase) {
      const detail = getDemoPlanVersionDetail(versionId);
      if (!detail) {
        return apiError(
          requestId,
          404,
          "not_found",
          "Versión de plan no encontrada",
        );
      }
      return apiSuccess(requestId, detail);
    }

    const { data: version, error } = await supabase
      .from("plan_versions")
      .select(
        `
        *,
        plan:plans (
          *,
          insurer:insurers (*)
        )
      `,
      )
      .eq("id", versionId)
      .maybeSingle();

    if (error) {
      return apiError(requestId, 500, "database_error", error.message);
    }

    if (!version) {
      return apiError(
        requestId,
        404,
        "not_found",
        "Versión de plan no encontrada",
      );
    }

    if (version.status !== "published" && !version.is_demo) {
      return apiError(
        requestId,
        404,
        "not_found",
        "Versión de plan no publicada",
      );
    }

    const [
      { data: coverage_clauses },
      { data: exclusions },
      { data: waiting_periods },
      { data: policy_documents },
    ] = await Promise.all([
      supabase
        .from("coverage_clauses")
        .select("*")
        .eq("plan_version_id", versionId)
        .order("sort_order"),
      supabase
        .from("exclusions")
        .select("*")
        .eq("plan_version_id", versionId)
        .order("sort_order"),
      supabase
        .from("waiting_periods")
        .select("*")
        .eq("plan_version_id", versionId),
      supabase
        .from("policy_documents")
        .select("*")
        .eq("plan_version_id", versionId),
    ]);

    const docIds = (policy_documents ?? []).map((d) => d.id);
    let citations: unknown[] = [];

    if (docIds.length > 0) {
      const { data: citationRows } = await supabase
        .from("citations")
        .select("*")
        .in("policy_document_id", docIds);
      citations = citationRows ?? [];
    }

    return apiSuccess(requestId, {
      version,
      plan: version.plan,
      insurer: (version.plan as { insurer?: unknown } | null)?.insurer,
      coverage_clauses: coverage_clauses ?? [],
      exclusions: exclusions ?? [],
      waiting_periods: waiting_periods ?? [],
      policy_documents: policy_documents ?? [],
      citations,
    });
  },
  { requiredScope: "read:catalog" },
);
