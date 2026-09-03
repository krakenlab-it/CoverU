import { NextResponse } from "next/server";
import { getOrgRequestLogs } from "@/lib/settings/request-logs";
import { requireSettingsSession } from "@/lib/settings/session";

export async function GET() {
  const session = await requireSettingsSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const logs = await getOrgRequestLogs(
    session.organizationId,
    session.isDemo,
  );
  return NextResponse.json(logs);
}
