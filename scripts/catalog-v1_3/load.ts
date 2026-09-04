import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { existsSync } from "node:fs";
import { join } from "node:path";
import { mapCatalogPackage } from "./map-rows";
import { parseCsv, readCsvFile } from "./parse-csv";
import type { CatalogPackage, TableCounts } from "./types";

const BATCH_SIZE = 250;

export interface LoadOptions {
  dataDir: string;
  dryRun: boolean;
  supabaseUrl?: string;
  serviceRoleKey?: string;
}

export interface LoadReport {
  dryRun: boolean;
  dataDir: string;
  before: TableCounts;
  after: TableCounts;
  package: CatalogPackage;
  publishedVersionCount: number;
  backfilledTariffCount: number;
}

function resolveSupabaseUrl(): string | undefined {
  return process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
}

function resolveServiceRoleKey(): string | undefined {
  return process.env.SUPABASE_SERVICE_ROLE_KEY;
}

export function createLoaderClient(
  supabaseUrl?: string,
  serviceRoleKey?: string,
): SupabaseClient | null {
  const url = supabaseUrl ?? resolveSupabaseUrl();
  const key = serviceRoleKey ?? resolveServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export function loadCatalogFiles(dataDir: string): CatalogPackage {
  const requiredFiles = [
    "insurers.csv",
    "plans.csv",
    "plan_versions.csv",
    "tariffs.csv",
  ];

  for (const file of requiredFiles) {
    const filePath = join(dataDir, file);
    if (!existsSync(filePath)) {
      throw new Error(`Missing required catalog file: ${filePath}`);
    }
  }

  return mapCatalogPackage({
    insurers: readCsvFile(join(dataDir, "insurers.csv")),
    plans: readCsvFile(join(dataDir, "plans.csv")),
    planVersions: readCsvFile(join(dataDir, "plan_versions.csv")),
    tariffs: readCsvFile(join(dataDir, "tariffs.csv")),
  });
}

export async function fetchTableCounts(
  client: SupabaseClient,
): Promise<TableCounts> {
  const insurers = await countTable(client, "insurers");
  const plans = await countTable(client, "plans");
  const planVersions = await countTable(client, "plan_versions");
  const publishedVersions = await countPublishedPlanVersions(client);
  const tariffs = await countTable(client, "tariffs");
  const tariffsWithVersion = await countTariffsWithPlanVersion(client);

  return {
    insurers,
    plans,
    plan_versions: planVersions,
    plan_versions_published: publishedVersions,
    tariffs,
    tariffs_with_plan_version: tariffsWithVersion,
  };
}

async function countPublishedPlanVersions(client: SupabaseClient): Promise<number> {
  const { count, error } = await client
    .from("plan_versions")
    .select("*", { count: "exact", head: true })
    .eq("status", "published");
  if (error) {
    throw new Error(`Failed to count published plan_versions: ${error.message}`);
  }
  return count ?? 0;
}

async function countTariffsWithPlanVersion(client: SupabaseClient): Promise<number> {
  const { count, error } = await client
    .from("tariffs")
    .select("*", { count: "exact", head: true })
    .not("plan_version_id", "is", null);
  if (error) {
    throw new Error(`Failed to count tariffs with plan_version_id: ${error.message}`);
  }
  return count ?? 0;
}

async function countTable(
  client: SupabaseClient,
  table: string,
): Promise<number> {
  const { count, error } = await client
    .from(table)
    .select("*", { count: "exact", head: true });
  if (error) {
    throw new Error(`Failed to count ${table}: ${error.message}`);
  }
  return count ?? 0;
}

async function upsertBatches(
  client: SupabaseClient,
  table: string,
  rows: object[],
  options?: { ignoreDuplicates?: boolean },
): Promise<void> {
  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const { error } = await client.from(table).upsert(batch, {
      onConflict: "id",
      ignoreDuplicates: options?.ignoreDuplicates ?? false,
    });
    if (error) {
      throw new Error(`Failed to upsert ${table} batch ${i / BATCH_SIZE + 1}: ${error.message}`);
    }
  }
}

export async function runCatalogLoad(
  options: LoadOptions,
): Promise<LoadReport> {
  const pkg = loadCatalogFiles(options.dataDir);
  const client = options.dryRun
    ? null
    : createLoaderClient(options.supabaseUrl, options.serviceRoleKey);

  if (!options.dryRun && !client) {
    throw new Error(
      "Supabase credentials required. Set SUPABASE_URL (or NEXT_PUBLIC_SUPABASE_URL) and SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  const before =
    client != null
      ? await fetchTableCounts(client)
      : emptyCounts();

  let publishedVersionCount = 0;
  let backfilledTariffCount = 0;

  if (!options.dryRun && client) {
    await upsertBatches(client, "insurers", pkg.insurers);
    await upsertBatches(client, "plans", pkg.plans);
    await upsertBatches(client, "plan_versions", pkg.planVersions, {
      ignoreDuplicates: true,
    });

    const publishedAt = new Date().toISOString();
    const versionIds = pkg.planVersions.map((version) => version.id);
    for (let i = 0; i < versionIds.length; i += BATCH_SIZE) {
      const batchIds = versionIds.slice(i, i + BATCH_SIZE);
      const { data, error } = await client
        .from("plan_versions")
        .update({
          status: "published",
          published_at: publishedAt,
        })
        .in("id", batchIds)
        .eq("status", "draft")
        .select("id");

      if (error) {
        throw new Error(`Failed to publish plan_versions: ${error.message}`);
      }
      publishedVersionCount += data?.length ?? 0;
    }

    const versionByPlanId = new Map(
      pkg.planVersions.map((version) => [version.plan_id, version.id]),
    );

    const tariffsWithVersion = pkg.tariffs.map((tariff) => ({
      ...tariff,
      plan_version_id: versionByPlanId.get(tariff.plan_id) ?? null,
    }));

    await upsertBatches(client, "tariffs", tariffsWithVersion);
    backfilledTariffCount = tariffsWithVersion.filter(
      (tariff) => tariff.plan_version_id != null,
    ).length;
  } else {
    publishedVersionCount = pkg.planVersions.length;
    backfilledTariffCount = pkg.tariffs.length;
  }

  const after =
    client != null
      ? await fetchTableCounts(client)
      : before;

  return {
    dryRun: options.dryRun,
    dataDir: options.dataDir,
    before,
    after,
    package: pkg,
    publishedVersionCount,
    backfilledTariffCount,
  };
}

function emptyCounts(): TableCounts {
  return {
    insurers: 0,
    plans: 0,
    plan_versions: 0,
    plan_versions_published: 0,
    tariffs: 0,
    tariffs_with_plan_version: 0,
  };
}

export function formatCounts(label: string, counts: TableCounts): string {
  return [
    `${label}:`,
    `  insurers: ${counts.insurers}`,
    `  plans: ${counts.plans}`,
    `  plan_versions: ${counts.plan_versions} (published: ${counts.plan_versions_published})`,
    `  tariffs: ${counts.tariffs} (with plan_version_id: ${counts.tariffs_with_plan_version})`,
  ].join("\n");
}

export function formatLoadReport(report: LoadReport): string {
  const lines = [
    report.dryRun ? "DRY RUN — no database writes" : "Catalog load complete",
    `Data directory: ${report.dataDir}`,
    "",
    "Parsed package:",
    `  insurers: ${report.package.insurers.length}`,
    `  plans: ${report.package.plans.length}`,
    `  plan_versions: ${report.package.planVersions.length}`,
    `  tariffs (loadable): ${report.package.tariffs.length}`,
    `  tariffs skipped (load_blocked/invalid): ${report.package.skippedTariffs.length}`,
    "",
    formatCounts("Before", report.before),
    "",
    formatCounts("After", report.after),
    "",
    `Published plan_versions: ${report.publishedVersionCount}`,
    `Backfilled tariffs.plan_version_id: ${report.backfilledTariffCount}`,
  ];

  if (report.package.skippedTariffs.length > 0) {
    lines.push("", "Skipped tariffs:");
    for (const skipped of report.package.skippedTariffs.slice(0, 10)) {
      lines.push(`  - ${skipped.id}: ${skipped.reasons.join(", ")}`);
    }
    if (report.package.skippedTariffs.length > 10) {
      lines.push(
        `  ... and ${report.package.skippedTariffs.length - 10} more`,
      );
    }
  }

  return lines.join("\n");
}

export { parseCsv };
