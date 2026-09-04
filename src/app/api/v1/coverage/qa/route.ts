import { z } from "zod";
import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { answerCoverageQuestion } from "@/lib/coverage/qa-provider";

const coverageQaSchema = z
  .object({
    plan_version_id: z.string().uuid().optional(),
    plan_id: z.string().uuid().optional(),
    question: z.string().min(3).max(1000),
    history: z
      .array(z.object({ question: z.string().min(3).max(1000) }))
      .max(8)
      .optional(),
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

    const result = await answerCoverageQuestion({
      planVersionId: parsed.data.plan_version_id,
      planId: parsed.data.plan_id,
      question: parsed.data.question,
      history: parsed.data.history,
      organizationId: ctx.auth.organizationId,
      requestId,
    });

    ctx.usageMetadata = {
      planVersionId: parsed.data.plan_version_id,
      metadata: {
        route: "coverage_qa",
        agent_run_id: result?.run.id ?? null,
        agent_status: result?.run.status ?? null,
        agent_tools: result?.run.tools.map((tool) => tool.name) ?? [],
        provider: result?.provider ?? null,
        result_status: result?.status ?? null,
        abstained: result?.abstained ?? null,
      },
    };

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
