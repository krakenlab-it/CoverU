import { existsSync } from "node:fs";
import { join } from "node:path";
import { mapCatalogPackage } from "@/lib/catalog/map-rows";
import { readCsvFile } from "@/lib/catalog/parse-csv";
import type { CatalogPackage } from "@/lib/catalog/types";
import type { Insurer, Plan, Tariff } from "@/lib/types/database";

/** Catalog package shipped in the repo (see data/catalog/v1.3/README.md). */
const CATALOG_PACKAGE_VERSION = "v1.3";

const CATALOG_FILES = [
  "insurers.csv",
  "plans.csv",
  "plan_versions.csv",
  "tariffs.csv",
] as const;

type CatalogFile = (typeof CATALOG_FILES)[number];

const CATALOG_CREATED_AT = "2026-09-03T17:36:27Z";

/** Statically scoped so the bundler only traces `data/catalog/v1.3`. */
function catalogFilePath(file: CatalogFile): string {
  return join(process.cwd(), "data", "catalog", CATALOG_PACKAGE_VERSION, file);
}

export interface CatalogDomain {
  insurers: Insurer[];
  plans: Plan[];
  tariffs: Tariff[];
}

export function isCatalogPackageAvailable(): boolean {
  return CATALOG_FILES.every((file) => existsSync(catalogFilePath(file)));
}

export function readCatalogPackage(): CatalogPackage {
  return mapCatalogPackage({
    insurers: readCsvFile(catalogFilePath("insurers.csv")),
    plans: readCsvFile(catalogFilePath("plans.csv")),
    planVersions: readCsvFile(catalogFilePath("plan_versions.csv")),
    tariffs: readCsvFile(catalogFilePath("tariffs.csv")),
  });
}

/**
 * Maps the v1.3 package rows onto the domain models the marketplace uses.
 * Only `active` plans are quotable; the mapping keeps status so the quoter can
 * enforce that.
 */
export function toCatalogDomain(pkg: CatalogPackage): CatalogDomain {
  const insurers: Insurer[] = pkg.insurers.map((row) => ({
    id: row.id,
    name: row.name,
    slug: row.slug,
    logo_url: row.logo_url,
    is_demo: row.is_demo,
    created_at: CATALOG_CREATED_AT,
  }));

  const plans: Plan[] = pkg.plans.map((row) => ({
    id: row.id,
    insurer_id: row.insurer_id,
    name: row.name,
    description: row.description,
    coverage_summary: row.coverage_summary,
    natural_key_plan_id: row.natural_key_plan_id,
    status: row.status,
    is_demo: row.is_demo,
    created_at: CATALOG_CREATED_AT,
  }));

  const tariffs: Tariff[] = pkg.tariffs.map((row) => ({
    id: row.id,
    plan_id: row.plan_id,
    age_min: row.age_min,
    age_max: row.age_max,
    gender: row.gender,
    region: row.region,
    grupo_asegurado: row.grupo_asegurado,
    maternidad: row.maternidad,
    monthly_price: row.monthly_price,
    raw_monthly_price_con_imp: row.raw_monthly_price_con_imp,
    raw_monthly_price_sin_imp: row.raw_monthly_price_sin_imp,
    tax_included: row.tax_included,
    tax_basis_raw: row.tax_basis_raw,
    deductible: row.deductible,
    copay_pct: row.copay_pct,
    annual_limit: row.annual_limit,
    exclusions: row.exclusions,
    is_demo: row.is_demo,
    periodicidad_origen: row.periodicidad_origen,
    vigencia_tarifario: row.vigencia_tarifario,
    archivo_fuente: row.archivo_fuente,
    source_file: row.source_file,
    source_drive_id: row.source_drive_id,
    sheet: row.sheet,
    excel_row: row.excel_row,
    load_blocked: row.load_blocked,
    load_block_reasons: row.load_block_reasons,
    created_at: CATALOG_CREATED_AT,
  }));

  return { insurers, plans, tariffs };
}

let cachedDomain: CatalogDomain | null = null;

/**
 * Parses and maps the bundled package once per server process. The CSV matrix is
 * ~6k rows, so re-parsing it on every request would be wasteful.
 */
export function getBundledCatalogDomain(): CatalogDomain | null {
  if (cachedDomain) return cachedDomain;
  if (!isCatalogPackageAvailable()) return null;

  cachedDomain = toCatalogDomain(readCatalogPackage());
  return cachedDomain;
}
