import { NextResponse } from "next/server";
import { emitFunnelEvent } from "@/lib/analytics/emit";
import { getPublicQuote } from "@/lib/quoters/public-quote";
import { compareQuerySchema } from "@/lib/validation";

const NO_CACHE_HEADERS = { "Cache-Control": "no-store" } as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = compareQuerySchema.safeParse({
    age: searchParams.get("age"),
    gender: searchParams.get("gender"),
    region: searchParams.get("region"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      {
        error: "Parámetros inválidos",
        details: parsed.error.flatten().fieldErrors,
      },
      { status: 400, headers: NO_CACHE_HEADERS },
    );
  }

  const quote = await getPublicQuote(parsed.data);

  if (!quote) {
    return NextResponse.json(
      { error: "El catálogo no está disponible en este momento." },
      { status: 503, headers: NO_CACHE_HEADERS },
    );
  }

  // Only a profile that actually priced plans counts as a funnel step; an empty
  // result or an unavailable catalog is a dead end, not a conversion.
  if (quote.totalOffers > 0) {
    await emitFunnelEvent({
      step: "quote",
      source: "compare",
      properties: { offerCount: quote.totalOffers },
    });
  }

  return NextResponse.json(quote, { headers: NO_CACHE_HEADERS });
}
