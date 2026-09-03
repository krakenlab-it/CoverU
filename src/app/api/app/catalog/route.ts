import { NextResponse } from "next/server";
import { requireAuthWithOrg } from "@/lib/auth/org";
import { searchMarketplace } from "@/lib/marketplace/catalog";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";

export async function GET(request: Request) {
  const session = await requireAuthWithOrg();
  if (!session) {
    return NextResponse.json(
      { error: { code: "unauthorized", message: "Sesión requerida" } },
      { status: 401 },
    );
  }

  const { searchParams } = new URL(request.url);
  const filters = parseMarketplaceFilters(searchParams);

  try {
    const results = await searchMarketplace(filters);
    return NextResponse.json({
      data: {
        results,
        filters,
      },
    });
  } catch {
    return NextResponse.json(
      {
        error: {
          code: "catalog_error",
          message: "No se pudo cargar el catálogo",
        },
      },
      { status: 500 },
    );
  }
}
