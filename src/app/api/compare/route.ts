import { NextResponse } from "next/server";
import { getComparisonResults } from "@/lib/comparison";
import { compareQuerySchema } from "@/lib/validation";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const parsed = compareQuerySchema.safeParse({
    age: searchParams.get("age"),
    gender: searchParams.get("gender"),
    region: searchParams.get("region"),
  });

  if (!parsed.success) {
    return NextResponse.json(
      { error: "Parámetros inválidos", details: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const results = await getComparisonResults(parsed.data);

  return NextResponse.json({ results });
}
