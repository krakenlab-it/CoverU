import { NextResponse } from "next/server";
import { z } from "zod";
import { revokeOrgApiKey } from "@/lib/settings/api-keys";
import {
  isOrgAdminRole,
  requireSettingsSession,
} from "@/lib/settings/session";

const revokeSchema = z.object({
  action: z.literal("revoke"),
});

type RouteContext = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireSettingsSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  if (!isOrgAdminRole(session.role)) {
    return NextResponse.json({ error: "Permisos insuficientes." }, { status: 403 });
  }

  const { id } = await context.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }

  const parsed = revokeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Acción inválida." }, { status: 400 });
  }

  const result = await revokeOrgApiKey(session.organizationId, id);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
