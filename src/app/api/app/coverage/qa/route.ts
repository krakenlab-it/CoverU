import { NextResponse } from "next/server";
import { z } from "zod";
import { logSessionApiUsage } from "@/lib/api/usage-log";
import { generateRequestId } from "@/lib/api/response";
import { requireAuthWithOrg } from "@/lib/auth/org";
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

export async function POST(request: Request) {
  const start = Date.now();
  const requestId = generateRequestId();
  const session = await requireAuthWithOrg();
  if (!session) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sesión requerida" } },
      { status: 401 },
    );
  }

  const membership = session.memberships[0];
  if (!membership) {
    return NextResponse.json(
      { error: { code: "forbidden", message: "Organización requerida" } },
      { status: 403 },
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    const response = NextResponse.json(
      { error: { code: "invalid_json", message: "Cuerpo JSON inválido" } },
      { status: 400 },
    );
    await logSessionApiUsage(
      membership.organizationId,
      requestId,
      request,
      400,
      Date.now() - start,
      { metadata: { route: "app_coverage_qa" } },
    );
    return response;
  }

  const parsed = coverageQaSchema.safeParse(body);
  if (!parsed.success) {
    const response = NextResponse.json(
      {
        error: {
          code: "validation_error",
          message: "Parámetros inválidos",
          details: parsed.error.flatten(),
        },
      },
      { status: 400 },
    );
    await logSessionApiUsage(
      membership.organizationId,
      requestId,
      request,
      400,
      Date.now() - start,
      {
        planVersionId: undefined,
        metadata: { route: "app_coverage_qa" },
      },
    );
    return response;
  }

  const result = await answerCoverageQuestion({
    planVersionId: parsed.data.plan_version_id,
    planId: parsed.data.plan_id,
    question: parsed.data.question,
    history: parsed.data.history,
    organizationId: membership.organizationId,
    requestId,
  });

  if (!result) {
    const response = NextResponse.json(
      {
        error: {
          code: "not_found",
          message: "Versión de plan no encontrada o no publicada",
        },
      },
      { status: 404 },
    );
    await logSessionApiUsage(
      membership.organizationId,
      requestId,
      request,
      404,
      Date.now() - start,
      {
        planVersionId: parsed.data.plan_version_id,
        metadata: { route: "app_coverage_qa" },
      },
    );
    return response;
  }

  const response = NextResponse.json({ data: result });
  await logSessionApiUsage(
    membership.organizationId,
    requestId,
    request,
    200,
    Date.now() - start,
    {
      planVersionId: parsed.data.plan_version_id,
      metadata: {
        route: "app_coverage_qa",
        agent_run_id: result.run.id,
        agent_status: result.run.status,
        agent_tools: result.run.tools.map((tool) => tool.name),
        provider: result.provider,
        result_status: result.status,
        abstained: result.abstained,
      },
    },
  );
  return response;
}
