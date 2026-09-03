import { describe, expect, it } from "vitest";
import {
  reconcilePreviewCounts,
  runIdempotentDryRun,
} from "@/lib/data-pipeline/dry-run";
import { buildChecksumManifest, computeFileChecksum } from "@/lib/data-pipeline/manifest";
import { quarantineReportSchema } from "@/lib/data-pipeline/quarantine";

const batchId = "d0000000-0000-4000-8000-000000000099";

function scaffoldInput() {
  return {
    batchId,
    manifest: buildChecksumManifest("0.0.0-scaffold", batchId, [
      {
        source_file: "plans.xlsx",
        sha256: computeFileChecksum("demo"),
        row_count: 3,
      },
    ]),
    quarantine: quarantineReportSchema.parse({
      batch_id: batchId,
      accepted_row_count: 3,
      rejected_rows: [],
    }),
  };
}

describe("data pipeline dry run scaffolding", () => {
  it("runs idempotent dry runs with stable preview counts", () => {
    const input = scaffoldInput();
    const preview = {
      insurers: 2,
      plans: 3,
      plan_versions: 3,
      tariffs: 9,
      rejected_rows: 0,
    };

    const first = runIdempotentDryRun(input, preview);
    const second = runIdempotentDryRun(input, preview, first);

    expect(first.idempotent).toBe(true);
    expect(second.idempotent).toBe(true);
    expect(first.preview).toEqual(preview);
  });

  it("reconciles preview counts and reports deltas", () => {
    const result = reconcilePreviewCounts(
      { insurers: 2, plans: 3, plan_versions: 3, tariffs: 9, rejected_rows: 0 },
      { insurers: 2, plans: 4, plan_versions: 3, tariffs: 9, rejected_rows: 1 },
    );

    expect(result.matches).toBe(false);
    expect(result.deltas.plans).toBe(1);
    expect(result.deltas.rejected_rows).toBe(1);
  });
});
