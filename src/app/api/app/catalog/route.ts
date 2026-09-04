import { NextResponse } from "next/server";
import { logSessionApiUsage } from "@/lib/api/usage-log";
import { generateRequestId } from "@/lib/api/response";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { searchMarketplace } from "@/lib/marketplace/catalog";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";

export async function GET(request: Request) {
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

  const { searchParams } = new URL(request.url);
  const filters = parseMarketplaceFilters(searchParams);

  try {
    const results = await searchMarketplace(filters);
    const response = NextResponse.json({
      data: {
        results,
        filters,
      },
    });
    await logSessionApiUsage(
      membership.organizationId,
      requestId,
      request,
      200,
      Date.now() - start,
      {
        metadata: {
          route: "marketplace_search",
          filters,
          result_count: results.length,
        },
      },
    );
    return response;
  } catch {
    const response = NextResponse.json(
      {
        error: {
          code: "catalog_error",
          message: "No se pudo cargar el catálogo",
        },
      },
      { status: 500 },
    );
    await logSessionApiUsage(
      membership.organizationId,
      requestId,
      request,
      500,
      Date.now() - start,
      {
        metadata: {
          route: "marketplace_search",
          filters,
        },
      },
    );
    return response;
  }
}
