import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { leadSchema } from "@/lib/validation";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = leadSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Datos inválidos", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const supabase = createAdminClient();

    if (!supabase) {
      // Accept lead in demo mode without persisting when Supabase is not configured.
      return NextResponse.json({
        success: true,
        demo: true,
        message:
          "Lead recibido en modo demo (Supabase no configurado). Configura las variables de entorno para persistir.",
      });
    }

    const { data, error } = await supabase
      .from("leads")
      .insert({
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone ?? null,
        age: parsed.data.age ?? null,
        gender: parsed.data.gender ?? null,
        region: parsed.data.region ?? null,
        source: parsed.data.source ?? "web",
        plan_interest: parsed.data.plan_interest ?? null,
      })
      .select("id")
      .single();

    if (error) {
      console.error("Lead insert error:", error.message);
      return NextResponse.json(
        { error: "No pudimos guardar tu solicitud. Intenta más tarde." },
        { status: 500 },
      );
    }

    return NextResponse.json({ success: true, id: data.id });
  } catch {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 },
    );
  }
}
