import { z } from "zod";
import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { answerCoverageQuestion } from "@/lib/coverage/qa-provider";

const coverageQaSchema = z
  .object({
    plan_version_id: z.string().uuid().optional(),
    plan_id: z.string().uuid().optional(),
    question: z.string().min(3).max(1000),
  })
  .refine((data) => data.plan_version_id || data.plan_id, {
    message: "plan_version_id o plan_id es requerido",
  });

export const POST = withApiV1(
  async (ctx) => {
    const { request, requestId } = ctx;
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError(
        requestId,
        400,
        "invalid_json",
        "Cuerpo JSON inválido",
      );
    }

    const parsed = coverageQaSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(
        requestId,
        400,
        "validation_error",
        "Parámetros inválidos",
        parsed.error.flatten(),
      );
    }

    ctx.usageMetadata = {
      planVersionId: parsed.data.plan_version_id,
      metadata: { route: "coverage_qa" },
    };

    const result = await answerCoverageQuestion({
      planVersionId: parsed.data.plan_version_id,
      planId: parsed.data.plan_id,
      question: parsed.data.question,
    });

    if (!result) {
      return apiError(
        requestId,
        404,
        "not_found",
        "Versión de plan no encontrada o no publicada",
      );
    }

    return apiSuccess(requestId, result);
  },
  { requiredScope: "read:coverage" },
);
