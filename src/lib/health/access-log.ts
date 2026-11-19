import { z } from "zod";
import {
  HEALTH_ACCESS_KINDS,
  HEALTH_FIELD_NAMES,
  HEALTH_RESOURCE_TYPES,
  type HealthAccessEvent,
  type HealthAccessKind,
  type HealthActorKind,
  type HealthResourceType,
} from "@/lib/health/types";

/**
 * Validation for health-data access events.
 *
 * The log stores field NAMES, never values. The schema is a strict object, so a caller
 * cannot smuggle extra properties (such as a decrypted value) into the audit trail.
 */

const IDENTIFIER = z.string().trim().min(1).max(200);
const OPTIONAL_LABEL = z.string().trim().min(1).max(200).optional();

const actorSchema = z.discriminatedUnion("kind", [
  z.strictObject({
    kind: z.literal("user"),
    userId: z.uuid(),
    role: z.string().trim().min(1).max(32).optional(),
    label: OPTIONAL_LABEL,
  }),
  z.strictObject({
    kind: z.literal("api_client"),
    apiKeyId: z.uuid(),
    label: OPTIONAL_LABEL,
  }),
  z.strictObject({
    kind: z.literal("service"),
    label: IDENTIFIER,
  }),
  z.strictObject({
    kind: z.literal("system"),
    label: IDENTIFIER,
  }),
]);

export const healthAccessEventSchema = z.strictObject({
  organizationId: z.uuid(),
  actor: actorSchema,
  resourceType: z.enum(HEALTH_RESOURCE_TYPES),
  resourceId: z.uuid(),
  subjectUserId: z.uuid().nullish(),
  fieldsAccessed: z.array(z.enum(HEALTH_FIELD_NAMES)).max(50),
  accessKind: z.enum(HEALTH_ACCESS_KINDS),
  purpose: z.string().trim().min(1).max(200).nullish(),
  requestContext: z
    .strictObject({
      requestId: z.string().trim().min(1).max(200).nullish(),
      ipAddress: z.string().trim().min(1).max(100).nullish(),
      userAgent: z.string().trim().min(1).max(500).nullish(),
    })
    .optional(),
});

/** Row shape written to `public.health_data_access_log`. */
export interface HealthDataAccessLogRow {
  organization_id: string;
  actor_kind: HealthActorKind;
  actor_user_id: string | null;
  actor_api_key_id: string | null;
  actor_label: string | null;
  actor_role: string | null;
  resource_type: HealthResourceType;
  resource_id: string;
  subject_user_id: string | null;
  fields_accessed: string[];
  access_kind: HealthAccessKind;
  purpose: string | null;
  request_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
}

export type HealthAccessLogErrorCode = "invalid_event" | "write_failed";

export class HealthAccessLogError extends Error {
  readonly code: HealthAccessLogErrorCode;

  constructor(code: HealthAccessLogErrorCode, message: string) {
    super(message);
    this.name = "HealthAccessLogError";
    this.code = code;
  }
}

/**
 * Maps an event to a table row. Actor identifiers land in the column matching their
 * kind, so the log always answers "who" without parsing labels.
 */
export function toHealthAccessLogRow(event: HealthAccessEvent): HealthDataAccessLogRow {
  const parsed = healthAccessEventSchema.safeParse(event);
  if (!parsed.success) {
    throw new HealthAccessLogError(
      "invalid_event",
      `Invalid health access event: ${parsed.error.issues
        .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
        .join("; ")}`,
    );
  }

  const valid = parsed.data;
  const requestContext = valid.requestContext ?? {};
  const { actor } = valid;

  return {
    organization_id: valid.organizationId,
    actor_kind: actor.kind,
    actor_user_id: actor.kind === "user" ? actor.userId : null,
    actor_api_key_id: actor.kind === "api_client" ? actor.apiKeyId : null,
    actor_label: actor.label ?? null,
    actor_role: actor.kind === "user" ? (actor.role ?? null) : null,
    resource_type: valid.resourceType,
    resource_id: valid.resourceId,
    subject_user_id: valid.subjectUserId ?? null,
    fields_accessed: [...new Set(valid.fieldsAccessed)].sort(),
    access_kind: valid.accessKind,
    purpose: valid.purpose ?? null,
    request_id: requestContext.requestId ?? null,
    ip_address: requestContext.ipAddress ?? null,
    user_agent: requestContext.userAgent ?? null,
  };
}

/** Narrow structural type for the insert-only table, so tests need no Supabase client. */
export interface HealthAccessLogInsertClient {
  insertHealthAccessLogRow(row: HealthDataAccessLogRow): Promise<{
    error: { message: string } | null;
  }>;
}

export interface HealthAccessLogger {
  warn(message: string, meta?: Record<string, unknown>): void;
}

export interface HealthAccessRecorder {
  record(event: HealthAccessEvent): Promise<void>;
}

/**
 * Append-only access-log writer.
 *
 * Ordering is deliberate: the row is validated and inserted FIRST, and only then may
 * the caller touch ciphertext. A view that cannot be logged must not happen.
 *
 * Diagnostic logs carry identifiers and field names only. The writer never receives
 * field values, so no plaintext health data can reach a log line.
 */
export function createHealthAccessRecorder(deps: {
  client: HealthAccessLogInsertClient | null;
  logger?: HealthAccessLogger;
}): HealthAccessRecorder {
  const { client, logger } = deps;

  return {
    async record(event: HealthAccessEvent): Promise<void> {
      const row = toHealthAccessLogRow(event);

      if (!client) {
        logger?.warn("health_access_log_unavailable", {
          organizationId: row.organization_id,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          accessKind: row.access_kind,
          fieldsAccessed: row.fields_accessed,
        });
        throw new HealthAccessLogError(
          "write_failed",
          "Health access log store is not configured",
        );
      }

      const { error } = await client.insertHealthAccessLogRow(row);

      if (error) {
        logger?.warn("health_access_log_write_failed", {
          organizationId: row.organization_id,
          resourceType: row.resource_type,
          resourceId: row.resource_id,
          accessKind: row.access_kind,
          fieldsAccessed: row.fields_accessed,
        });
        throw new HealthAccessLogError(
          "write_failed",
          "Health access log write failed",
        );
      }
    },
  };
}
