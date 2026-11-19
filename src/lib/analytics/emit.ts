/**
 * Typed funnel emitter. One job: turn a funnel event into a row in
 * public.funnel_events, and never let that work affect the request that
 * produced it.
 *
 * - The payload is validated first (`parseFunnelEvent`), so an event carrying
 *   anything outside the allowlist — including health data — is dropped before
 *   it can reach the database.
 * - With Supabase unconfigured the emitter is a no-op, so the public quoter and
 *   its forms keep working in demo mode.
 * - Failures are logged and swallowed: analytics is never allowed to turn a
 *   successful lead into an error response.
 */
import { appLogger } from "@/lib/logging/logger";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  parseFunnelEvent,
  toFunnelEventRow,
  type FunnelEventRow,
} from "@/lib/analytics/funnel-events";

const logger = appLogger;

export type FunnelEventWriteOutcome =
  | { status: "recorded" }
  | { status: "skipped" }
  | { status: "failed"; message: string };

/** The single database call the emitter makes; injectable for tests. */
export type FunnelEventWriter = (
  row: FunnelEventRow,
) => Promise<FunnelEventWriteOutcome>;

/** Default writer: service-role insert, skipping cleanly when unconfigured. */
const writeWithAdminClient: FunnelEventWriter = async (row) => {
  const supabase = createAdminClient();
  if (!supabase) return { status: "skipped" };

  const { error } = await supabase.from("funnel_events").insert(row);

  if (error) return { status: "failed", message: error.message };
  return { status: "recorded" };
};

export interface EmitFunnelEventOptions {
  /** Tenant the event belongs to; omit for public-site traffic. */
  organizationId?: string | null;
  /** Replaces the database writer in tests. */
  writer?: FunnelEventWriter;
}

/**
 * Records one funnel step. Resolves for every outcome — invalid payload, demo
 * mode, database error — because every caller is a user-facing request.
 */
export async function emitFunnelEvent(
  payload: unknown,
  options: EmitFunnelEventOptions = {},
): Promise<void> {
  const { organizationId = null, writer = writeWithAdminClient } = options;
  const parsed = parseFunnelEvent(payload);

  if (!parsed.ok) {
    logger.warn("Funnel event rejected", { reason: parsed.reason });
    return;
  }

  try {
    const outcome = await writer(toFunnelEventRow(parsed.event, organizationId));

    if (outcome.status === "failed") {
      logger.error("Funnel event insert failed", { message: outcome.message });
    }
  } catch (error) {
    logger.error("Funnel event insert threw", {
      message: error instanceof Error ? error.message : "unknown",
    });
  }
}
