import type {
  CatalogPackage,
  InsurerRow,
  PlanRow,
  PlanVersionRow,
  TariffRow,
} from "./types";

export function emptyToNull(value: string): string | null {
  const trimmed = value.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function parseBoolean(value: string): boolean {
  const normalized = value.trim().toLowerCase();
  return normalized === "true" || normalized === "1" || normalized === "yes";
}

export function parseOptionalNumber(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseRequiredNumber(value: string, field: string): number {
  const parsed = parseOptionalNumber(value);
  if (parsed == null) {
    throw new Error(`Missing required numeric field: ${field}`);
  }
  return parsed;
}

export function parseOptionalInteger(value: string): number | null {
  const parsed = parseOptionalNumber(value);
  if (parsed == null) return null;
  return Math.trunc(parsed);
}

export function parseStringArray(value: string): string[] | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("{") && trimmed.endsWith("}")) {
    const inner = trimmed.slice(1, -1).trim();
    if (!inner) return [];
    return inner
      .split(",")
      .map((part) => part.trim().replace(/^"(.*)"$/, "$1"))
      .filter(Boolean);
  }
  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    try {
      const parsed = JSON.parse(trimmed) as unknown;
      return Array.isArray(parsed) ? parsed.map(String) : [trimmed];
    } catch {
      return [trimmed];
    }
  }
  return [trimmed];
}

export function mapInsurerRow(raw: Record<string, string>): InsurerRow {
  return {
    id: raw.id.trim(),
    name: raw.name.trim(),
    slug: raw.slug.trim(),
    logo_url: emptyToNull(raw.logo_url ?? ""),
    is_demo: parseBoolean(raw.is_demo ?? "false"),
  };
}

export function mapPlanRow(raw: Record<string, string>): PlanRow {
  const status = (emptyToNull(raw.status ?? "") ?? "active") as PlanRow["status"];
  return {
    id: raw.id.trim(),
    insurer_id: raw.insurer_id.trim(),
    name: raw.name.trim(),
    description: emptyToNull(raw.description ?? ""),
    coverage_summary: emptyToNull(raw.coverage_summary ?? ""),
    status,
    is_demo: parseBoolean(raw.is_demo ?? "false"),
    natural_key_plan_id: emptyToNull(raw.natural_key_plan_id ?? ""),
  };
}

export function mapPlanVersionRow(raw: Record<string, string>): PlanVersionRow {
  const status = (emptyToNull(raw.status ?? "") ??
    "draft") as PlanVersionRow["status"];
  return {
    id: raw.id.trim(),
    plan_id: raw.plan_id.trim(),
    version_number: parseRequiredNumber(raw.version_number ?? "", "version_number"),
    label: emptyToNull(raw.label ?? ""),
    status,
    effective_from: emptyToNull(raw.effective_from ?? ""),
    effective_to: emptyToNull(raw.effective_to ?? ""),
    published_at: emptyToNull(raw.published_at ?? ""),
    changelog: emptyToNull(raw.changelog ?? ""),
    is_demo: parseBoolean(raw.is_demo ?? "false"),
  };
}

export function mapTariffRow(
  raw: Record<string, string>,
): { row: TariffRow | null; skipReason: string | null } {
  const loadBlocked = parseBoolean(raw.load_blocked ?? "false");
  const blockReasons = parseStringArray(raw.load_block_reasons ?? "");

  if (loadBlocked) {
    return {
      row: null,
      skipReason:
        blockReasons?.join("; ") || "load_blocked=true",
    };
  }

  const monthlyPrice = parseOptionalNumber(raw.monthly_price ?? "");
  if (monthlyPrice == null || monthlyPrice <= 0) {
    return {
      row: null,
      skipReason: "missing or invalid monthly_price",
    };
  }

  const gender = (emptyToNull(raw.gender ?? "") ?? "any") as TariffRow["gender"];
  const region = emptyToNull(raw.region ?? "") as TariffRow["region"] | null;
  if (!region) {
    return { row: null, skipReason: "missing region" };
  }

  const maternidadRaw = emptyToNull(raw.maternidad ?? "");
  const maternidad =
    maternidadRaw === "Si" || maternidadRaw === "No"
      ? maternidadRaw
      : null;

  const grupoRaw = emptyToNull(raw.grupo_asegurado ?? "");
  const grupo_asegurado =
    grupoRaw === "titular" || grupoRaw === "nino_solo" ? grupoRaw : null;

  return {
    row: {
      id: raw.id.trim(),
      plan_id: raw.plan_id.trim(),
      age_min: parseRequiredNumber(raw.age_min ?? "", "age_min"),
      age_max: parseRequiredNumber(raw.age_max ?? "", "age_max"),
      gender,
      region,
      monthly_price: monthlyPrice,
      raw_monthly_price_con_imp: parseOptionalNumber(
        raw.raw_monthly_price_con_imp ?? "",
      ),
      raw_monthly_price_sin_imp: parseOptionalNumber(
        raw.raw_monthly_price_sin_imp ?? "",
      ),
      tax_included: raw.tax_included
        ? parseBoolean(raw.tax_included)
        : null,
      tax_basis_raw: emptyToNull(raw.tax_basis_raw ?? ""),
      deductible: parseOptionalNumber(raw.deductible ?? ""),
      copay_pct: parseOptionalInteger(raw.copay_pct ?? ""),
      annual_limit: parseOptionalNumber(raw.annual_limit ?? ""),
      exclusions: parseStringArray(raw.exclusions ?? ""),
      is_demo: parseBoolean(raw.is_demo ?? "false"),
      maternidad,
      grupo_asegurado,
      periodicidad_origen: emptyToNull(raw.periodicidad_origen ?? ""),
      vigencia_tarifario: emptyToNull(raw.vigencia_tarifario ?? ""),
      archivo_fuente: emptyToNull(raw.archivo_fuente ?? ""),
      source_file: emptyToNull(raw.source_file ?? ""),
      source_drive_id: emptyToNull(raw.source_drive_id ?? ""),
      sheet: emptyToNull(raw.sheet ?? ""),
      excel_row: parseOptionalInteger(raw.excel_row ?? ""),
      load_blocked: false,
      load_block_reasons: blockReasons,
    },
    skipReason: null,
  };
}

export function mapCatalogPackage(input: {
  insurers: Record<string, string>[];
  plans: Record<string, string>[];
  planVersions: Record<string, string>[];
  tariffs: Record<string, string>[];
}): CatalogPackage {
  const skippedTariffs: { id: string; reasons: string[] }[] = [];
  const tariffs: TariffRow[] = [];

  for (const raw of input.tariffs) {
    const { row, skipReason } = mapTariffRow(raw);
    if (row) {
      tariffs.push(row);
    } else if (skipReason) {
      skippedTariffs.push({
        id: raw.id?.trim() || "unknown",
        reasons: [skipReason],
      });
    }
  }

  return {
    insurers: input.insurers.map(mapInsurerRow),
    plans: input.plans.map(mapPlanRow),
    planVersions: input.planVersions.map(mapPlanVersionRow),
    tariffs,
    skippedTariffs,
  };
}
