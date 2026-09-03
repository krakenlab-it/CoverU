-- CoverU tariff schema v1.1 (clean/v1.1 package) — schema only, no Excel data import
-- Locked decisions: monthly_price stores USD monthly from matrix prima_mensual_con_imp (not cents).

-- ---------------------------------------------------------------------------
-- 1) tariffs.monthly_price: INTEGER → NUMERIC(12,2)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tariffs
  DROP CONSTRAINT IF EXISTS tariffs_monthly_price_check;

ALTER TABLE public.tariffs
  ALTER COLUMN monthly_price TYPE NUMERIC(12, 2)
  USING monthly_price::numeric;

ALTER TABLE public.tariffs
  ADD CONSTRAINT tariffs_monthly_price_check
  CHECK (monthly_price IS NULL OR monthly_price > 0);

COMMENT ON COLUMN public.tariffs.monthly_price IS
  'USD monthly premium from insurer matrix column prima_mensual_con_imp. Values are dollars, not cents. Do not divide BMI annual values by 12.';

-- quotes.monthly_price aligned for API/type consistency (same units as tariffs)
ALTER TABLE public.quotes
  DROP CONSTRAINT IF EXISTS quotes_monthly_price_check;

ALTER TABLE public.quotes
  ALTER COLUMN monthly_price TYPE NUMERIC(12, 2)
  USING monthly_price::numeric;

ALTER TABLE public.quotes
  ADD CONSTRAINT quotes_monthly_price_check
  CHECK (monthly_price IS NULL OR monthly_price > 0);

COMMENT ON COLUMN public.quotes.monthly_price IS
  'USD monthly premium snapshot at quote time (same units as tariffs.monthly_price).';

-- ---------------------------------------------------------------------------
-- 2) Loader readiness: tariffs lineage & plan_version linkage
-- ---------------------------------------------------------------------------

ALTER TABLE public.tariffs
  ADD COLUMN IF NOT EXISTS plan_version_id UUID
    REFERENCES public.plan_versions(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS tariffs_plan_version_id_idx
  ON public.tariffs(plan_version_id);

ALTER TABLE public.tariffs
  ADD COLUMN IF NOT EXISTS grupo_asegurado TEXT;

ALTER TABLE public.tariffs
  ADD COLUMN IF NOT EXISTS tax_included BOOLEAN,
  ADD COLUMN IF NOT EXISTS tax_basis_raw TEXT;

-- Intended uniqueness once plan_version_id is backfilled for all tariff rows.
-- Partial index: only enforces uniqueness when plan_version_id is present (deferred backfill).
COMMENT ON TABLE public.tariffs IS
  'Tariff matrix rows. Loader intent: UNIQUE (plan_version_id, age_min, age_max, gender, region, grupo_asegurado) after backfill. plan_id retained for legacy lookups until loader migration completes.';

CREATE UNIQUE INDEX IF NOT EXISTS tariffs_plan_version_lookup_unique_idx
  ON public.tariffs (plan_version_id, age_min, age_max, gender, region, grupo_asegurado)
  WHERE plan_version_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 3) plans provenance (loader source tracking)
-- ---------------------------------------------------------------------------

ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS coverage_provenance TEXT,
  ADD COLUMN IF NOT EXISTS copay_provenance TEXT,
  ADD COLUMN IF NOT EXISTS waiting_period_provenance TEXT;

-- ---------------------------------------------------------------------------
-- 4) tariffs.exclusions: drop empty-array default (empty ≠ no exclusions)
-- ---------------------------------------------------------------------------

ALTER TABLE public.tariffs
  ALTER COLUMN exclusions DROP DEFAULT;

-- ---------------------------------------------------------------------------
-- 5) coverage_clauses: add unknown status + raw text for loader (no coercion)
-- ---------------------------------------------------------------------------

ALTER TABLE public.coverage_clauses
  DROP CONSTRAINT IF EXISTS coverage_clauses_coverage_status_check;

ALTER TABLE public.coverage_clauses
  ADD CONSTRAINT coverage_clauses_coverage_status_check
  CHECK (coverage_status IN ('covered', 'not_covered', 'conditional', 'unknown'));

ALTER TABLE public.coverage_clauses
  ADD COLUMN IF NOT EXISTS coverage_status_text TEXT;

COMMENT ON COLUMN public.coverage_clauses.coverage_status_text IS
  'Raw coverage status text from source matrix when enum value is unknown or ambiguous. Do not coerce unknown to conditional.';
