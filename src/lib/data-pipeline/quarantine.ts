import { z } from "zod";

export const quarantinedRowSchema = z.object({
  row_number: z.number().int().positive(),
  source_file: z.string().min(1),
  sheet_name: z.string().optional(),
  reason_code: z.enum([
    "invalid_uuid",
    "missing_required_field",
    "invalid_numeric",
    "duplicate_key",
    "schema_mismatch",
    "checksum_mismatch",
    "unknown_insurer",
    "unknown_plan",
  ]),
  reason_detail: z.string().min(1),
  raw_values: z.record(z.string(), z.unknown()),
  quarantined_at: z.string().datetime(),
});

export const quarantineReportSchema = z.object({
  batch_id: z.string().uuid(),
  rejected_rows: z.array(quarantinedRowSchema),
  accepted_row_count: z.number().int().nonnegative(),
});

export type QuarantinedRow = z.infer<typeof quarantinedRowSchema>;
export type QuarantineReport = z.infer<typeof quarantineReportSchema>;

export function createQuarantinedRow(
  input: Omit<QuarantinedRow, "quarantined_at">,
): QuarantinedRow {
  return quarantinedRowSchema.parse({
    ...input,
    quarantined_at: new Date().toISOString(),
  });
}

export function summarizeQuarantine(report: QuarantineReport): {
  totalRejected: number;
  byReason: Record<string, number>;
} {
  const byReason: Record<string, number> = {};
  for (const row of report.rejected_rows) {
    byReason[row.reason_code] = (byReason[row.reason_code] ?? 0) + 1;
  }
  return { totalRejected: report.rejected_rows.length, byReason };
}
