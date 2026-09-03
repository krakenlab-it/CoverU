import { NextResponse } from "next/server";
import { z } from "zod";
import {
  getOrgRateLimitPolicy,
  updateOrgRateLimitPolicy,
} from "@/lib/settings/rate-limits";
import {
  isOrgAdminRole,
  requireSettingsSession,
} from "@/lib/settings/session";

const updateSchema = z.object({
  requestsPerWindow: z.number().int().min(1).max(10000),
  windowMs: z.number().int().min(1000).max(86400000),
});

export async function GET() {
  const session = await requireSettingsSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const policy = await getOrgRateLimitPolicy(session.organizationId);
  return NextResponse.json(policy);
}

export async function PUT(request: Request) {
  const session = await requireSettingsSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isOrgAdminRole(session.role)) {
    return NextResponse.json({ error: "Permisos insuficientes." }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = updateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Valores de límite inválidos." },
      { status: 400 },
    );
  }

  const result = await updateOrgRateLimitPolicy(
    session.organizationId,
    session.userId,
    parsed.data,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const policy = await getOrgRateLimitPolicy(session.organizationId);
  return NextResponse.json({ success: true, policy });
}
