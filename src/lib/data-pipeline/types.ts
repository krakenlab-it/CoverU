import { z } from "zod";

export const checksumManifestEntrySchema = z.object({
  source_file: z.string().min(1),
  sha256: z.string().regex(/^[a-f0-9]{64}$/i),
  row_count: z.number().int().nonnegative(),
  sheet_name: z.string().optional(),
  ingested_at: z.string().datetime().optional(),
});

export const checksumManifestSchema = z.object({
  loader_version: z.string().min(1),
  batch_id: z.string().uuid(),
  entries: z.array(checksumManifestEntrySchema).min(1),
});

export type ChecksumManifest = z.infer<typeof checksumManifestSchema>;
export type ChecksumManifestEntry = z.infer<typeof checksumManifestEntrySchema>;
