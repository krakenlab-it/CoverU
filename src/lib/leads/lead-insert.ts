import { needsHumanFollowup, type LeadIntent } from "@/lib/leads/consent";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Lead } from "@/lib/types/database";

/** Row written to public.leads. `needs_human_followup` is derived, never client-supplied. */
export type LeadInsertRow = Omit<
  Lead,
  "id" | "created_at" | "needs_human_followup" | "consent_granted_at"
>;

export type LeadInsertResult =
  | { status: "created"; id: string; needsHumanFollowup: boolean }
  | { status: "demo"; needsHumanFollowup: boolean }
  | { status: "error"; message: string };

/**
 * Persists a validated lead. Returns `demo` when Supabase is not configured so
 * the public forms keep working locally and on previews without a database.
 */
export async function leadInsert(row: LeadInsertRow): Promise<LeadInsertResult> {
  const intent: LeadIntent = row.intent;
  const followup = needsHumanFollowup(intent);
  const supabase = createAdminClient();

  if (!supabase) {
    return { status: "demo", needsHumanFollowup: followup };
  }

  const { data, error } = await supabase
    .from("leads")
    .insert({
      ...row,
      needs_human_followup: followup,
      consent_granted: true,
      consent_granted_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  if (error) {
    console.error("Lead insert error:", error.message);
    return { status: "error", message: error.message };
  }

  return { status: "created", id: data.id, needsHumanFollowup: followup };
}
