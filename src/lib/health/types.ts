/**
 * Shared vocabulary for client health data (Ecuador LOPDP).
 *
 * No health-data columns exist yet (KAN-241 client file and KAN-242 application are
 * still blocked), so this registry is the typed contract used by the encryption helper
 * and the access log. Adding a field here is the only way to make it loggable.
 */

export const HEALTH_FIELD_NAMES = [
  "allergies",
  "chronic_conditions",
  "disability_status",
  "family_history",
  "lab_results",
  "medical_notes",
  "medications",
  "pregnancy_status",
  "surgeries",
] as const;

export type HealthFieldName = (typeof HEALTH_FIELD_NAMES)[number];

export const HEALTH_RESOURCE_TYPES = [
  "client_file",
  "application",
  "health_profile",
] as const;

export type HealthResourceType = (typeof HEALTH_RESOURCE_TYPES)[number];

export const HEALTH_ACCESS_KINDS = ["view", "list", "export", "decrypt"] as const;

export type HealthAccessKind = (typeof HEALTH_ACCESS_KINDS)[number];

export type HealthActorKind = "user" | "api_client" | "service" | "system";

export type HealthAccessActor =
  | { kind: "user"; userId: string; role?: string | null; label?: string | null }
  | { kind: "api_client"; apiKeyId: string; label?: string | null }
  | { kind: "service"; label: string }
  | { kind: "system"; label: string };

export interface HealthRequestContext {
  requestId?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

export interface HealthAccessEvent {
  organizationId: string;
  actor: HealthAccessActor;
  resourceType: HealthResourceType;
  resourceId: string;
  subjectUserId?: string | null;
  fieldsAccessed: readonly HealthFieldName[];
  accessKind: HealthAccessKind;
  purpose?: string | null;
  requestContext?: HealthRequestContext;
}

/** Event as a caller describes it, before the field list is derived from ciphertext. */
export type HealthAccessRequest = Omit<HealthAccessEvent, "fieldsAccessed" | "accessKind"> & {
  accessKind?: HealthAccessKind;
};

/** Everything the ciphertext is bound to. Decryption fails if any part differs. */
export interface HealthFieldEncryptionContext {
  organizationId: string;
  resourceType: HealthResourceType;
  resourceId: string;
  field: HealthFieldName;
}

export function isHealthFieldName(value: string): value is HealthFieldName {
  return (HEALTH_FIELD_NAMES as readonly string[]).includes(value);
}
