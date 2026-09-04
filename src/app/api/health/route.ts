import { NextResponse } from "next/server";
import { generateRequestId, REQUEST_ID_HEADER } from "@/lib/api/response";

export const dynamic = "force-dynamic";

export async function GET() {
  const requestId = generateRequestId();

  return NextResponse.json(
    {
      status: "ok",
      service: "coveru",
      timestamp: new Date().toISOString(),
      request_id: requestId,
    },
    {
      headers: {
        [REQUEST_ID_HEADER]: requestId,
        "Cache-Control": "no-store",
      },
    },
  );
}
