import { describe, expect, it } from "vitest";
import {
  createQuarantinedRow,
  summarizeQuarantine,
  quarantineReportSchema,
} from "@/lib/data-pipeline/quarantine";

describe("data pipeline quarantine contract", () => {
  it("creates rejected rows with required reason codes", () => {
    const row = createQuarantinedRow({
      row_number: 12,
      source_file: "plans.xlsx",
      reason_code: "invalid_uuid",
      reason_detail: "plan_id is not a UUID",
      raw_values: { plan_id: "not-a-uuid" },
    });

    expect(row.reason_code).toBe("invalid_uuid");
    expect(row.quarantined_at).toBeTruthy();
  });

  it("summarizes quarantine reports", () => {
    const report = quarantineReportSchema.parse({
      batch_id: "d0000000-0000-4000-8000-000000000099",
      accepted_row_count: 5,
      rejected_rows: [
        createQuarantinedRow({
          row_number: 1,
          source_file: "plans.xlsx",
          reason_code: "duplicate_key",
          reason_detail: "duplicate plan slug",
          raw_values: {},
        }),
      ],
    });

    const summary = summarizeQuarantine(report);
    expect(summary.totalRejected).toBe(1);
    expect(summary.byReason.duplicate_key).toBe(1);
  });
});
