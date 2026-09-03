import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { answerCoverageQuestion } from "@/lib/coverage/qa-provider";

const coverageQaSchema = z.object({
  plan_version_id: z.string().uuid(),
  question: z.string().min(3).max(1000),
});

export async function POST(request: Request) {
  const session = await requireAuthWithOrg();
  if (!session) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sesión requerida" } },
      { status: 401 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: { code: "invalid_json", message: "Cuerpo JSON inválido" } },
      { status: 400 },
    );
  }

  const parsed = coverageQaSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Parámetros inválidos",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
  }

  const result = await answerCoverageQuestion({
    planVersionId: parsed.data.plan_version_id,
    question: parsed.data.question,
  });

  if (!result) {
    return NextResponse.json(
      {
        error: {
          code: "not_found",
          message: "Versión de plan no encontrada o no publicada",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({ data: result });
}
