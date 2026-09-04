import type { DryRunResult } from "@/lib/data-pipeline/dry-run";
import type { QuarantineReport } from "@/lib/data-pipeline/quarantine";
import { summarizeQuarantine } from "@/lib/data-pipeline/quarantine";
import { verifyManifestIntegrity } from "@/lib/data-pipeline/manifest";
import type { ChecksumManifest } from "@/lib/data-pipeline/types";

export type PromotionGateDecision = "allow" | "block";

export interface PromotionGateInput {
  manifest: ChecksumManifest;
  quarantine: QuarantineReport;
  dryRun: DryRunResult;
  maxRejectedRows?: number;
  requireIdempotent?: boolean;
}

export interface PromotionGateResult {
  decision: PromotionGateDecision;
  reasons: string[];
}

export function evaluatePromotionGate(
  input: PromotionGateInput,
): PromotionGateResult {
  const reasons: string[] = [];
  const maxRejected = input.maxRejectedRows ?? 0;
  const requireIdempotent = input.requireIdempotent ?? true;

  const manifestCheck = verifyManifestIntegrity(input.manifest);
  if (!manifestCheck.valid) {
    reasons.push(...manifestCheck.issues);
  }

  const quarantineSummary = summarizeQuarantine(input.quarantine);
  if (quarantineSummary.totalRejected > maxRejected) {
    reasons.push(
      `Rejected row count ${quarantineSummary.totalRejected} exceeds limit ${maxRejected}`,
    );
  }

  if (requireIdempotent && !input.dryRun.idempotent) {
    reasons.push("Dry run is not idempotent compared to previous preview");
  }

  if (input.dryRun.warnings.length > 0) {
    reasons.push(...input.dryRun.warnings);
  }

  if (input.manifest.batch_id !== input.dryRun.batchId) {
    reasons.push("Manifest batch_id does not match dry-run batch_id");
  }

  return {
    decision: reasons.length === 0 ? "allow" : "block",
    reasons,
  };
}
