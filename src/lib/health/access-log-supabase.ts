import { createAdminClient } from "@/lib/supabase/admin";
import {
  createHealthAccessRecorder,
  type HealthAccessLogInsertClient,
  type HealthAccessRecorder,
  type HealthDataAccessLogRow,
} from "@/lib/health/access-log";
import { appLogger } from "@/lib/logging/logger";

/**
 * Supabase binding for the append-only health access log.
 *
 * Writes use the service-role client because the table grants INSERT to `service_role`
 * only; RLS still exposes SELECT to org admins. There is no update or delete path here
 * because the table rejects both for every role.
 */

export const HEALTH_ACCESS_LOG_TABLE = "health_data_access_log";

/** Minimal structural slice of the Supabase client this module needs. */
export interface HealthAccessLogSupabaseClient {
  from(table: typeof HEALTH_ACCESS_LOG_TABLE): {
    insert(
      row: HealthDataAccessLogRow,
    ): PromiseLike<{ error: { message: string } | null }>;
  };
}

export function createSupabaseHealthAccessLogClient(
  client: HealthAccessLogSupabaseClient,
): HealthAccessLogInsertClient {
  return {
    async insertHealthAccessLogRow(row: HealthDataAccessLogRow) {
      const { error } = await client.from(HEALTH_ACCESS_LOG_TABLE).insert(row);
      return { error: error ? { message: error.message } : null };
    },
  };
}

/**
 * Server-side recorder. Throws `HealthAccessLogError` when Supabase is not configured,
 * so a caller can never read health data on an instance that cannot log the read.
 */
export function createServerHealthAccessRecorder(): HealthAccessRecorder {
  const admin = createAdminClient();

  return createHealthAccessRecorder({
    client: admin ? createSupabaseHealthAccessLogClient(admin) : null,
    logger: appLogger,
  });
}
