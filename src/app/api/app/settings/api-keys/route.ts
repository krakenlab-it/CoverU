import { NextResponse } from "next/server";
import { z } from "zod";
import { createOrgApiKey, listOrgApiKeys } from "@/lib/settings/api-keys";
import {
  isOrgAdminRole,
  requireSettingsSession,
} from "@/lib/settings/session";

const createKeySchema = z.object({
  name: z.string().trim().min(1).max(120),
});

export async function POST(request: Request) {
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

  const parsed = createKeySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Nombre de clave inválido." },
      { status: 400 },
    );
  }

  const result = await createOrgApiKey(
    session.organizationId,
    parsed.data.name,
  );

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return NextResponse.json({
    key: result.key,
    rawKey: result.rawKey,
  });
}

export async function GET() {
  const session = await requireSettingsSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const result = await listOrgApiKeys(session.organizationId);
  return NextResponse.json(result);
}
