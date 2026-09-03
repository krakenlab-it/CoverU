import { NextResponse } from "next/server";
import { createConfirmedSignupUser } from "@/lib/auth/signup-server";
import { createAdminClient } from "@/lib/supabase/admin";
import { signupSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = signupSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "invalid" }, { status: 400 });
    }

    const admin = createAdminClient();

    if (!admin) {
      return NextResponse.json(
        { error: "service_unavailable" },
        { status: 503 },
      );
    }

    const result = await createConfirmedSignupUser(admin, {
      email: parsed.data.email,
      password: parsed.data.password,
      organizationName: parsed.data.organizationName,
    });

    if (!result.ok) {
      const status =
        result.code === "email_exists"
          ? 409
          : result.code === "invalid"
            ? 400
            : 500;

      return NextResponse.json({ error: result.code }, { status });
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "unknown" }, { status: 500 });
  }
}
