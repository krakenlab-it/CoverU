import { NextResponse } from "next/server";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { getPlanVersionDetailForMarketplace } from "@/lib/marketplace/catalog";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const session = await requireAuthWithOrg();
  if (!session) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sesión requerida" } },
      { status: 401 },
    );
  }

  const { id } = await context.params;
  const detail = getPlanVersionDetailForMarketplace(id);

  if (!detail?.version || detail.version.status !== "published") {
    return NextResponse.json(
      {
        error: {
          code: "not_found",
          message: "Versión de plan no encontrada",
        },
      },
      { status: 404 },
    );
  }

  return NextResponse.json({
    data: {
      ...detail,
      isDemo: detail.version.is_demo,
    },
  });
}
