-- CoverU tariff schema v1.3 (clean/v1.3 package) — schema only, no Excel data import
-- Aligned to observed v1.3 grain: 3 insurers, 141 plans, 141 draft plan_versions, 6137 tariffs.
-- coverage_clauses / exclusions / waiting_periods / scenarios / policy_documents / citations: zero rows in v1.3.

-- ---------------------------------------------------------------------------
-- FK decision (plan_id vs plan_version_id)
-- ---------------------------------------------------------------------------
-- v1.3 source files key tariffs by plan_id (not plan_version_id). Each plan has exactly one
-- draft plan_version (version_number=1) that can be backfilled 1:1 after catalog load.
-- We keep BOTH columns:
--   - plan_id: NOT NULL, required for v1.3 loader rows
--   - plan_version_id: nullable until backfill; partial unique index from v1.1 still applies when set
-- Loaders must NOT reject rows that only provide plan_id.

COMMENT ON COLUMN public.tariffs.plan_id IS
  'Primary tariff parent for v1.3 matrix rows (source column plan_id). Required for catalog load.';

COMMENT ON COLUMN public.tariffs.plan_version_id IS
  'Optional link to plan_versions after 1:1 backfill from draft version_number=1. Nullable during v1.3 load.';

-- ---------------------------------------------------------------------------
-- 1) plans: natural key from source matrix
-- ---------------------------------------------------------------------------

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS natural_key_plan_id TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS plans_natural_key_plan_id_unique_idx
  ON public.plans (natural_key_plan_id)
  WHERE natural_key_plan_id IS NOT NULL;

COMMENT ON COLUMN public.plans.natural_key_plan_id IS
  'Stable plan identifier from v1.3 source (natural_key_plan_id). Nullable for demo rows.';

COMMENT ON COLUMN public.plans.coverage_summary IS
  'Optional marketing summary. 100% null in v1.3 — do not require for catalog load.';

-- ---------------------------------------------------------------------------
-- 2) tariffs: v1.3 dimensions, lineage, and sparse optional fields
-- ---------------------------------------------------------------------------

ALTER TABLE public.tariffs
  ADD COLUMN IF NOT EXISTS maternidad TEXT,
  ADD COLUMN IF NOT EXISTS raw_monthly_price_con_imp NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS raw_monthly_price_sin_imp NUMERIC(12, 2),
  ADD COLUMN IF NOT EXISTS periodicidad_origen TEXT,
  ADD COLUMN IF NOT EXISTS vigencia_tarifario TEXT,
  ADD COLUMN IF NOT EXISTS archivo_fuente TEXT,
  ADD COLUMN IF NOT EXISTS source_file TEXT,
  ADD COLUMN IF NOT EXISTS source_drive_id TEXT,
  ADD COLUMN IF NOT EXISTS sheet TEXT,
  ADD COLUMN IF NOT EXISTS excel_row INTEGER,
  ADD COLUMN IF NOT EXISTS load_blocked BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS load_block_reasons TEXT[];

COMMENT ON COLUMN public.tariffs.monthly_price IS
  'USD monthly premium tax-included (prima_mensual_con_imp). Dollars, not cents. Sellable price.';

COMMENT ON COLUMN public.tariffs.raw_monthly_price_con_imp IS
  'Lineage only: raw prima_mensual_con_imp from source. Not a sellable price column.';

COMMENT ON COLUMN public.tariffs.raw_monthly_price_sin_imp IS
  'Lineage only: raw prima_mensual_sin_imp from source. Not a sellable price column.';

COMMENT ON COLUMN public.tariffs.maternidad IS
  'Sparse tariff dimension (Confiamed ConfiPlus: Si/No). Nullable — 91% null in v1.3.';

COMMENT ON COLUMN public.tariffs.deductible IS
  'Sparse tariff dimension. Nullable — 22.5% null in v1.3 (BMI always present; Confiamed/Saludsa often missing).';

COMMENT ON COLUMN public.tariffs.annual_limit IS
  'Sparse tariff dimension. Nullable — 88.8% null in v1.3 (only Confiamed filled).';

COMMENT ON COLUMN public.tariffs.copay_pct IS
  'Optional copay percentage. 100% null in v1.3 — do not require for catalog load.';

COMMENT ON COLUMN public.tariffs.exclusions IS
  'Optional JSON exclusions on tariff row. 100% null in v1.3 — do not require for catalog load.';

COMMENT ON COLUMN public.tariffs.load_block_reasons IS
  'Loader block reasons when load_blocked=true. 100% null in v1.3 — do not require for catalog load.';

-- Backfill demo rows so region/grupo CHECK constraints apply cleanly
UPDATE public.tariffs
SET region = 'Nacional'
WHERE is_demo = true AND region = 'metropolitana';

UPDATE public.tariffs
SET grupo_asegurado = 'titular'
WHERE is_demo = true AND grupo_asegurado IS NULL;

-- ---------------------------------------------------------------------------
-- 3) CHECK constraints aligned to v1.3 observed values
-- ---------------------------------------------------------------------------

ALTER TABLE public.tariffs
  DROP CONSTRAINT IF EXISTS tariffs_gender_check;

ALTER TABLE public.tariffs
  ADD CONSTRAINT tariffs_gender_check
  CHECK (gender IN ('any', 'femenino', 'masculino'));

ALTER TABLE public.tariffs
  DROP CONSTRAINT IF EXISTS tariffs_region_check;

ALTER TABLE public.tariffs
  ADD CONSTRAINT tariffs_region_check
  CHECK (region IN ('Nacional', 'Austro', 'Costa', 'Sierra'));

ALTER TABLE public.tariffs
  DROP CONSTRAINT IF EXISTS tariffs_grupo_asegurado_check;

ALTER TABLE public.tariffs
  ADD CONSTRAINT tariffs_grupo_asegurado_check
  CHECK (grupo_asegurado IS NULL OR grupo_asegurado IN ('titular', 'nino_solo'));

ALTER TABLE public.tariffs
  DROP CONSTRAINT IF EXISTS tariffs_maternidad_check;

ALTER TABLE public.tariffs
  ADD CONSTRAINT tariffs_maternidad_check
  CHECK (maternidad IS NULL OR maternidad IN ('Si', 'No'));

-- tax_included: boolean, 100% filled in v1.3; nullable for legacy/demo rows
COMMENT ON COLUMN public.tariffs.tax_included IS
  'Whether monthly_price includes tax (prima_mensual_con_imp). v1.3: always true when present.';

-- ---------------------------------------------------------------------------
-- 4) Unique grain for v1.3 load (conservative: business dims + lineage tiebreaker)
-- ---------------------------------------------------------------------------
-- Business grain: plan + age band + gender + region + grupo_asegurado
--   + deductible / annual_limit / maternidad when present (COALESCE sentinels).
-- Lineage tiebreaker: source_file + excel_row (conservative — avoids rejecting ambiguous rows).
-- Does NOT require plan_version_id; v1.3 file keys by plan_id only.
-- v1.1 partial unique on plan_version_id remains for post-backfill lookups.

COMMENT ON TABLE public.tariffs IS
  'Tariff matrix rows. v1.3 load grain: UNIQUE on plan_id + age/gender/region/grupo_asegurado + sparse dims + source_file/excel_row. plan_version_id optional until 1:1 draft backfill.';

CREATE UNIQUE INDEX IF NOT EXISTS tariffs_v1_3_load_grain_unique_idx
  ON public.tariffs (
    plan_id,
    age_min,
    age_max,
    gender,
    region,
    COALESCE(grupo_asegurado, 'titular'),
    COALESCE(deductible, -1),
    COALESCE(annual_limit, -1),
    COALESCE(maternidad, ''),
    COALESCE(source_file, ''),
    COALESCE(excel_row, -1)
  );

-- ---------------------------------------------------------------------------
-- 5) plan_versions: dates remain nullable (100% null effective/publish in v1.3)
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN public.plan_versions.effective_from IS
  'Optional vigencia start. 100% null in v1.3 draft versions — do not require for catalog load.';

COMMENT ON COLUMN public.plan_versions.effective_to IS
  'Optional vigencia end. 100% null in v1.3 draft versions — do not require for catalog load.';

COMMENT ON COLUMN public.plan_versions.published_at IS
  'Optional publish timestamp. 100% null in v1.3 (all draft) — do not require for catalog load.';

-- ---------------------------------------------------------------------------
-- 6) insurers.logo_url: remains nullable (100% null in v1.3)
-- ---------------------------------------------------------------------------

COMMENT ON COLUMN public.insurers.logo_url IS
  'Optional insurer logo URL. 100% null in v1.3 — do not require for catalog load.';
