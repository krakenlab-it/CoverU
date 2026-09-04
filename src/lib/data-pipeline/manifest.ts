import { createHash } from "crypto";
import {
  checksumManifestSchema,
  type ChecksumManifest,
  type ChecksumManifestEntry,
} from "@/lib/data-pipeline/types";

export function computeFileChecksum(content: string | Buffer): string {
  return createHash("sha256").update(content).digest("hex");
}

export function buildChecksumManifest(
  loaderVersion: string,
  batchId: string,
  entries: ChecksumManifestEntry[],
): ChecksumManifest {
  const manifest = checksumManifestSchema.parse({
    loader_version: loaderVersion,
    batch_id: batchId,
    entries,
  });
  return manifest;
}

export function verifyManifestIntegrity(manifest: ChecksumManifest): {
  valid: boolean;
  issues: string[];
} {
  const issues: string[] = [];
  const seenFiles = new Set<string>();

  for (const entry of manifest.entries) {
    if (seenFiles.has(entry.source_file)) {
      issues.push(`Duplicate source_file in manifest: ${entry.source_file}`);
    }
    seenFiles.add(entry.source_file);
  }

  return { valid: issues.length === 0, issues };
}
