import { describe, expect, it } from "vitest";
import {
  buildChecksumManifest,
  computeFileChecksum,
  verifyManifestIntegrity,
} from "@/lib/data-pipeline/manifest";

describe("data pipeline checksum manifest", () => {
  it("computes deterministic sha256 checksums", () => {
    const a = computeFileChecksum("demo-row-1");
    const b = computeFileChecksum("demo-row-1");
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("validates manifest schema and duplicate file detection", () => {
    const manifest = buildChecksumManifest("0.0.0-scaffold", "d0000000-0000-4000-8000-000000000099", [
      {
        source_file: "plans.xlsx",
        sha256: computeFileChecksum("sheet-a"),
        row_count: 10,
      },
    ]);

    expect(verifyManifestIntegrity(manifest).valid).toBe(true);
  });
});
