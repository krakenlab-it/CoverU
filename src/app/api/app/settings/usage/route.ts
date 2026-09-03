import { NextResponse } from "next/server";
import { getOrgUsageSummary } from "@/lib/settings/usage";
import { requireSettingsSession } from "@/lib/settings/session";

export async function GET() {
  const session = await requireSettingsSession();
  if (!session) {
    return NextResponse.json({ error: "No autorizado." }, { status: 401 });
  }

  const usage = await getOrgUsageSummary(
    session.organizationId,
    session.isDemo,
  );
  return NextResponse.json(usage);
}
