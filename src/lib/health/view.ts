import {
  decryptHealthRecord,
  type HealthKeyring,
  type PlainHealthRecord,
} from "@/lib/health/encryption";
import {
  HealthAccessLogError,
  type HealthAccessRecorder,
} from "@/lib/health/access-log";
import type {
  HealthAccessEvent,
  HealthAccessRequest,
  HealthFieldEncryptionContext,
  HealthFieldName,
} from "@/lib/health/types";

/**
 * Read path for client health data.
 *
 * LOPDP requires the access to be recorded. The order is therefore:
 *   1. write the access-log row,
 *   2. only then decrypt.
 *
 * If the log write fails the read fails (`HealthAccessLogError`), so no health data is
 * ever returned without a matching "who viewed what, when" record. Nothing in this
 * module logs values: only the decrypt result, held in memory by the caller, carries
 * plaintext.
 */

export interface HealthViewRequest {
  event: HealthAccessRequest;
  /** Encrypted columns for one resource, exactly as stored. */
  encrypted: Readonly<Partial<Record<HealthFieldName, string | null>>>;
  /** Resource coordinates the ciphertext is bound to. */
  context: Omit<HealthFieldEncryptionContext, "field">;
  keyring?: HealthKeyring;
}

export interface HealthViewResult {
  organizationId: string;
  resourceType: HealthAccessEvent["resourceType"];
  resourceId: string;
  accessKind: HealthAccessEvent["accessKind"];
  fieldsDecrypted: HealthFieldName[];
  record: PlainHealthRecord;
}

export async function viewHealthFields(
  recorder: HealthAccessRecorder,
  request: HealthViewRequest,
): Promise<HealthViewResult> {
  const fieldsAccessed = (
    Object.entries(request.encrypted) as Array<[HealthFieldName, string | null | undefined]>
  )
    .filter(([, value]) => value !== undefined && value !== null)
    .map(([field]) => field);

  if (fieldsAccessed.length === 0) {
    throw new HealthAccessLogError(
      "invalid_event",
      "Health view request contains no ciphertext to log",
    );
  }

  if (
    request.event.organizationId !== request.context.organizationId ||
    request.event.resourceType !== request.context.resourceType ||
    request.event.resourceId !== request.context.resourceId
  ) {
    throw new HealthAccessLogError(
      "invalid_event",
      "Access log event and encryption context must describe the same resource",
    );
  }

  const accessKind = request.event.accessKind ?? "view";

  await recorder.record({ ...request.event, accessKind, fieldsAccessed });

  const record = decryptHealthRecord(
    request.encrypted,
    request.context,
    request.keyring,
  );

  return {
    organizationId: request.context.organizationId,
    resourceType: request.context.resourceType,
    resourceId: request.context.resourceId,
    accessKind,
    fieldsDecrypted: fieldsAccessed,
    record,
  };
}
