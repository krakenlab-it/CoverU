import type { ChecksumManifest } from "@/lib/data-pipeline/types";
import type { QuarantineReport } from "@/lib/data-pipeline/quarantine";

export interface DryRunInput {
  batchId: string;
  manifest: ChecksumManifest;
  quarantine: QuarantineReport;
}

export interface DryRunPreviewCounts {
  insurers: number;
  plans: number;
  plan_versions: number;
  tariffs: number;
  rejected_rows: number;
}

export interface DryRunResult {
  batchId: string;
  idempotent: boolean;
  preview: DryRunPreviewCounts;
  warnings: string[];
}

/**
 * Scaffolding for the forthcoming CoverU Excel loader dry run.
 * Does not read files or mutate any database — counts are supplied by the caller.
 */
export function runIdempotentDryRun(
  input: DryRunInput,
  previewCounts: DryRunPreviewCounts,
  previousRun?: DryRunResult,
): DryRunResult {
  const warnings: string[] = [];

  if (input.quarantine.batch_id !== input.batchId) {
    warnings.push("Quarantine batch_id does not match dry-run batch_id");
  }

  if (input.manifest.batch_id !== input.batchId) {
    warnings.push("Manifest batch_id does not match dry-run batch_id");
  }

  const idempotent =
    previousRun === undefined ||
    (previousRun.preview.insurers === previewCounts.insurers &&
      previousRun.preview.plans === previewCounts.plans &&
      previousRun.preview.plan_versions === previewCounts.plan_versions &&
      previousRun.preview.tariffs === previewCounts.tariffs &&
      previousRun.preview.rejected_rows === previewCounts.rejected_rows);

  return {
    batchId: input.batchId,
    idempotent,
    preview: previewCounts,
    warnings,
  };
}

export function reconcilePreviewCounts(
  expected: DryRunPreviewCounts,
  actual: DryRunPreviewCounts,
): { matches: boolean; deltas: Partial<Record<keyof DryRunPreviewCounts, number>> } {
  const deltas: Partial<Record<keyof DryRunPreviewCounts, number>> = {};
  let matches = true;

  for (const key of Object.keys(expected) as Array<keyof DryRunPreviewCounts>) {
    const delta = actual[key] - expected[key];
    if (delta !== 0) {
      deltas[key] = delta;
      matches = false;
    }
  }

  return { matches, deltas };
}
