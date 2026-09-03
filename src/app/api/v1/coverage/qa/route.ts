import { z } from "zod";
import { apiError, apiSuccess, withApiV1 } from "@/lib/api/handler";
import { answerCoverageQuestion } from "@/lib/coverage/qa-provider";

const coverageQaSchema = z.object({
  plan_version_id: z.string().uuid(),
  question: z.string().min(3).max(1000),
});

export const POST = withApiV1(
  async ({ request, requestId }) => {
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
