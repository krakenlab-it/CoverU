import { describe, expect, it } from "vitest";
import { evaluatePromotionGate } from "@/lib/data-pipeline/promotion-gate";
import { runIdempotentDryRun } from "@/lib/data-pipeline/dry-run";
import { buildChecksumManifest, computeFileChecksum } from "@/lib/data-pipeline/manifest";
import {
  createQuarantinedRow,
  quarantineReportSchema,
} from "@/lib/data-pipeline/quarantine";

const batchId = "d0000000-0000-4000-8000-000000000099";

describe("data pipeline promotion gate", () => {
  it("blocks promotion when rejected rows exceed threshold", () => {
    const manifest = buildChecksumManifest("0.0.0-scaffold", batchId, [
      {
        source_file: "plans.xlsx",
        sha256: computeFileChecksum("demo"),
        row_count: 1,
      },
    ]);

    const quarantine = quarantineReportSchema.parse({
      batch_id: batchId,
      accepted_row_count: 0,
      rejected_rows: [
        createQuarantinedRow({
          row_number: 2,
          source_file: "plans.xlsx",
          reason_code: "schema_mismatch",
          reason_detail: "missing column",
          raw_values: {},
        }),
      ],
    });

    const dryRun = runIdempotentDryRun(
      { batchId, manifest, quarantine },
      {
        insurers: 0,
        plans: 0,
        plan_versions: 0,
        tariffs: 0,
        rejected_rows: 1,
      },
    );

    const gate = evaluatePromotionGate({
      manifest,
      quarantine,
      dryRun,
      maxRejectedRows: 0,
    });

    expect(gate.decision).toBe("block");
    expect(gate.reasons.length).toBeGreaterThan(0);
  });

  it("allows promotion when manifest, quarantine, and dry run align", () => {
    const manifest = buildChecksumManifest("0.0.0-scaffold", batchId, [
      {
        source_file: "plans.xlsx",
        sha256: computeFileChecksum("demo"),
        row_count: 3,
      },
    ]);

    const quarantine = quarantineReportSchema.parse({
      batch_id: batchId,
      accepted_row_count: 3,
      rejected_rows: [],
    });

    const dryRun = runIdempotentDryRun(
      { batchId, manifest, quarantine },
      {
        insurers: 2,
        plans: 3,
        plan_versions: 3,
        tariffs: 9,
        rejected_rows: 0,
      },
    );

    const gate = evaluatePromotionGate({ manifest, quarantine, dryRun });
    expect(gate.decision).toBe("allow");
    expect(gate.reasons).toEqual([]);
  });
});
