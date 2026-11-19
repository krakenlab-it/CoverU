-- CoverU plan conditions (KAN-230) — deductibles, coinsurance, copays, payment modality, coverage ceilings.
--
-- Additive only. public.exclusions and public.waiting_periods already exist (20250102000000_phase1_schema.sql)
-- and are extended here with an exclusion type; nothing is dropped or re-created.
-- Column parity: KAN-229 insurer data-request template (v1) fields 3 (deducible), 4 (coaseguro),
-- 5 (copagos), 9 (techo de cobertura / límite anual) and 12 (modalidad de pago).
-- Every row hangs off plan_versions, so conditions are versioned exactly like coverage_clauses.
-- Money columns are USD (Ecuador), not cents.
-- Demo fixtures are marked [DEMO] / is_demo = true and are replay-safe (WHERE NOT EXISTS guards).
-- Immutability triggers are created after the fixtures so the initial demo pack can populate
-- published demo versions; afterwards every published-version condition row is frozen.

-- ---------------------------------------------------------------------------
-- 1) Deductibles (template field 3: monto por persona/familia, por evento/año)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_deductibles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL DEFAULT 'individual'
    CHECK (scope IN ('individual', 'familiar')),
  basis TEXT NOT NULL DEFAULT 'por_anio'
    CHECK (basis IN ('por_evento', 'por_anio', 'por_ingreso', 'vitalicio')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_deductibles_version_id_idx
  ON public.plan_deductibles(plan_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS plan_deductibles_version_scope_basis_unique_idx
  ON public.plan_deductibles(plan_version_id, scope, basis);

COMMENT ON COLUMN public.plan_deductibles.amount IS
  'Deductible amount in USD (Ecuador), dollars not cents. 0 means no deductible.';
COMMENT ON COLUMN public.plan_deductibles.scope IS
  'KAN-229 field 3: monto por persona (individual) o por familia (familiar).';
COMMENT ON COLUMN public.plan_deductibles.basis IS
  'KAN-229 field 3: si aplica por evento, por año (por_anio), por ingreso hospitalario o de por vida.';

-- ---------------------------------------------------------------------------
-- 2) Coinsurance (template field 4: % aseguradora / % asegurado, dentro y fuera de red)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_coinsurance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  network TEXT NOT NULL DEFAULT 'en_red'
    CHECK (network IN ('en_red', 'fuera_de_red')),
  insurer_pct NUMERIC(5, 2) NOT NULL
    CHECK (insurer_pct >= 0 AND insurer_pct <= 100),
  insured_pct NUMERIC(5, 2) NOT NULL
    CHECK (insured_pct >= 0 AND insured_pct <= 100),
  service_category TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT plan_coinsurance_split_check
    CHECK (insurer_pct + insured_pct = 100)
);

CREATE INDEX IF NOT EXISTS plan_coinsurance_version_id_idx
  ON public.plan_coinsurance(plan_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS plan_coinsurance_version_network_category_unique_idx
  ON public.plan_coinsurance(plan_version_id, network, COALESCE(service_category, ''));

COMMENT ON COLUMN public.plan_coinsurance.insurer_pct IS
  'KAN-229 field 4: percentage covered by the insurer.';
COMMENT ON COLUMN public.plan_coinsurance.insured_pct IS
  'KAN-229 field 4: percentage paid by the insured. insurer_pct + insured_pct must equal 100.';
COMMENT ON COLUMN public.plan_coinsurance.service_category IS
  'Optional benefit category (hospitalizacion, urgencias, ...) when the split differs by benefit.';

-- ---------------------------------------------------------------------------
-- 3) Copays (template field 5: monto fijo por consulta, examen, medicamento o emergencia)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_copays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL,
  network TEXT NOT NULL DEFAULT 'en_red'
    CHECK (network IN ('en_red', 'fuera_de_red')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_copays_version_id_idx
  ON public.plan_copays(plan_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS plan_copays_version_category_network_unique_idx
  ON public.plan_copays(plan_version_id, service_category, network);

COMMENT ON COLUMN public.plan_copays.amount IS
  'Fixed copay in USD (Ecuador), dollars not cents.';
COMMENT ON COLUMN public.plan_copays.service_category IS
  'KAN-229 field 5: consulta, examen, medicamento, emergencia, hospitalizacion, ...';

-- ---------------------------------------------------------------------------
-- 4) Payment modality (template field 12: medios y frecuencias de pago aceptados)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_payment_modalities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  method TEXT NOT NULL
    CHECK (method IN ('debito', 'tarjeta_credito', 'transferencia', 'efectivo', 'otro')),
  frequency TEXT NOT NULL
    CHECK (frequency IN ('mensual', 'trimestral', 'semestral', 'anual')),
  is_default BOOLEAN NOT NULL DEFAULT false,
  payment_url TEXT CHECK (payment_url IS NULL OR payment_url ~ '^https?://'),
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_payment_modalities_version_id_idx
  ON public.plan_payment_modalities(plan_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS plan_payment_modalities_version_method_frequency_unique_idx
  ON public.plan_payment_modalities(plan_version_id, method, frequency);

-- At most one default payment modality per plan version.
CREATE UNIQUE INDEX IF NOT EXISTS plan_payment_modalities_single_default_idx
  ON public.plan_payment_modalities(plan_version_id)
  WHERE is_default;

COMMENT ON COLUMN public.plan_payment_modalities.frequency IS
  'KAN-229 fields 2 and 12: mensual, trimestral, semestral or anual billing frequency.';
COMMENT ON COLUMN public.plan_payment_modalities.payment_url IS
  'Optional insurer payment page or button URL when one exists.';

-- ---------------------------------------------------------------------------
-- 5) Coverage ceilings (template field 9: techo por año, por evento o de por vida)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_coverage_ceilings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  scope TEXT NOT NULL
    CHECK (scope IN ('por_persona', 'por_familia', 'por_evento', 'por_anio', 'vitalicio')),
  amount NUMERIC(12, 2) NOT NULL CHECK (amount > 0),
  service_category TEXT,
  notes TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plan_coverage_ceilings_version_id_idx
  ON public.plan_coverage_ceilings(plan_version_id);

CREATE UNIQUE INDEX IF NOT EXISTS plan_coverage_ceilings_version_scope_category_unique_idx
  ON public.plan_coverage_ceilings(plan_version_id, scope, COALESCE(service_category, ''));

COMMENT ON COLUMN public.plan_coverage_ceilings.amount IS
  'Coverage ceiling in USD (Ecuador), dollars not cents.';
COMMENT ON COLUMN public.plan_coverage_ceilings.scope IS
  'KAN-229 field 9: por año, por evento, de por vida, o por persona/familia.';
COMMENT ON COLUMN public.plan_coverage_ceilings.service_category IS
  'Optional benefit category when the ceiling only applies to that benefit.';

-- ---------------------------------------------------------------------------
-- 6) Additive column on the existing exclusions table (template field 7)
-- ---------------------------------------------------------------------------

ALTER TABLE public.exclusions
  ADD COLUMN IF NOT EXISTS exclusion_type TEXT;

ALTER TABLE public.exclusions
  DROP CONSTRAINT IF EXISTS exclusions_exclusion_type_check;

ALTER TABLE public.exclusions
  ADD CONSTRAINT exclusions_exclusion_type_check
  CHECK (exclusion_type IS NULL OR exclusion_type IN ('general', 'especifica'));

COMMENT ON COLUMN public.exclusions.exclusion_type IS
  'KAN-229 field 7: general exclusion vs plan-specific (especifica). Nullable for legacy rows.';

-- Classify the existing demo exclusions from 20250102000001_phase1_seed_demo.sql.
-- Additive backfill: only rows that are still unclassified are touched.
UPDATE public.exclusions
SET exclusion_type = 'general'
WHERE is_demo = true
  AND exclusion_type IS NULL
  AND title IN ('Tratamientos cosméticos', 'Preexistencias no declaradas');

-- ---------------------------------------------------------------------------
-- 7) Row Level Security — published (or demo) versions are readable; writes via service role
-- ---------------------------------------------------------------------------

ALTER TABLE public.plan_deductibles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_coinsurance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_copays ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_payment_modalities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_coverage_ceilings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "plan_deductibles_published_read" ON public.plan_deductibles;
CREATE POLICY "plan_deductibles_published_read" ON public.plan_deductibles
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

DROP POLICY IF EXISTS "plan_deductibles_service_all" ON public.plan_deductibles;
CREATE POLICY "plan_deductibles_service_all" ON public.plan_deductibles
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plan_coinsurance_published_read" ON public.plan_coinsurance;
CREATE POLICY "plan_coinsurance_published_read" ON public.plan_coinsurance
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

DROP POLICY IF EXISTS "plan_coinsurance_service_all" ON public.plan_coinsurance;
CREATE POLICY "plan_coinsurance_service_all" ON public.plan_coinsurance
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plan_copays_published_read" ON public.plan_copays;
CREATE POLICY "plan_copays_published_read" ON public.plan_copays
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

DROP POLICY IF EXISTS "plan_copays_service_all" ON public.plan_copays;
CREATE POLICY "plan_copays_service_all" ON public.plan_copays
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plan_payment_modalities_published_read" ON public.plan_payment_modalities;
CREATE POLICY "plan_payment_modalities_published_read" ON public.plan_payment_modalities
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

DROP POLICY IF EXISTS "plan_payment_modalities_service_all" ON public.plan_payment_modalities;
CREATE POLICY "plan_payment_modalities_service_all" ON public.plan_payment_modalities
  FOR ALL TO service_role USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "plan_coverage_ceilings_published_read" ON public.plan_coverage_ceilings;
CREATE POLICY "plan_coverage_ceilings_published_read" ON public.plan_coverage_ceilings
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

DROP POLICY IF EXISTS "plan_coverage_ceilings_service_all" ON public.plan_coverage_ceilings;
CREATE POLICY "plan_coverage_ceilings_service_all" ON public.plan_coverage_ceilings
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ---------------------------------------------------------------------------
-- 8) Demo fixtures for the published demo plan versions (is_demo = true, idempotent)
-- ---------------------------------------------------------------------------
-- 8) Demo fixtures for the published demo plan versions (is_demo = true, replay-safe)
-- ---------------------------------------------------------------------------
-- Fixtures use INSERT ... SELECT ... WHERE NOT EXISTS instead of ON CONFLICT: the
-- immutability trigger below is a BEFORE INSERT trigger, so it fires before
-- ON CONFLICT could swallow a duplicate row. The guard keeps re-runs clean and also
-- lets the migration be replayed after the trigger exists.

INSERT INTO public.plan_deductibles (id, plan_version_id, scope, basis, amount, notes, sort_order, is_demo)
SELECT v.id, v.plan_version_id, v.scope, v.basis, v.amount, v.notes, v.sort_order, true
FROM (VALUES
  (
    'e1000000-0000-4000-8000-000000000001'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'individual',
    'por_anio',
    100.00::numeric,
    '[DEMO] Deducible individual por año. Dato de ejemplo, no vigente.',
    1
  ),
  (
    'e1000000-0000-4000-8000-000000000002'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'familiar',
    'por_anio',
    300.00::numeric,
    '[DEMO] Deducible familiar por año. Dato de ejemplo, no vigente.',
    2
  ),
  (
    'e1000000-0000-4000-8000-000000000003'::uuid,
    'd1000000-0000-4000-8000-000000000002'::uuid,
    'individual',
    'por_anio',
    50.00::numeric,
    '[DEMO] Deducible individual por año. Dato de ejemplo, no vigente.',
    1
  )
) AS v(id, plan_version_id, scope, basis, amount, notes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_deductibles d WHERE d.id = v.id
);

INSERT INTO public.plan_coinsurance (id, plan_version_id, network, insurer_pct, insured_pct, service_category, notes, sort_order, is_demo)
SELECT v.id, v.plan_version_id, v.network, v.insurer_pct, v.insured_pct, v.service_category, v.notes, v.sort_order, true
FROM (VALUES
  (
    'e2000000-0000-4000-8000-000000000001'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'en_red',
    80.00::numeric,
    20.00::numeric,
    NULL::text,
    '[DEMO] Coaseguro 80% aseguradora / 20% asegurado en red.',
    1
  ),
  (
    'e2000000-0000-4000-8000-000000000002'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'fuera_de_red',
    70.00::numeric,
    30.00::numeric,
    NULL::text,
    '[DEMO] Coaseguro 70% aseguradora / 30% asegurado fuera de red.',
    2
  ),
  (
    'e2000000-0000-4000-8000-000000000003'::uuid,
    'd1000000-0000-4000-8000-000000000002'::uuid,
    'en_red',
    90.00::numeric,
    10.00::numeric,
    NULL::text,
    '[DEMO] Coaseguro 90% aseguradora / 10% asegurado en red.',
    1
  )
) AS v(id, plan_version_id, network, insurer_pct, insured_pct, service_category, notes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_coinsurance c WHERE c.id = v.id
);

INSERT INTO public.plan_copays (id, plan_version_id, service_category, network, amount, notes, sort_order, is_demo)
SELECT v.id, v.plan_version_id, v.service_category, v.network, v.amount, v.notes, v.sort_order, true
FROM (VALUES
  (
    'e3000000-0000-4000-8000-000000000001'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'consulta',
    'en_red',
    10.00::numeric,
    '[DEMO] Copago fijo por consulta en red.',
    1
  ),
  (
    'e3000000-0000-4000-8000-000000000002'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'emergencia',
    'en_red',
    25.00::numeric,
    '[DEMO] Copago fijo por emergencia en red.',
    2
  ),
  (
    'e3000000-0000-4000-8000-000000000003'::uuid,
    'd1000000-0000-4000-8000-000000000002'::uuid,
    'consulta',
    'en_red',
    5.00::numeric,
    '[DEMO] Copago fijo por consulta en red.',
    1
  )
) AS v(id, plan_version_id, service_category, network, amount, notes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_copays cp WHERE cp.id = v.id
);

INSERT INTO public.plan_payment_modalities (id, plan_version_id, method, frequency, is_default, payment_url, notes, sort_order, is_demo)
SELECT v.id, v.plan_version_id, v.method, v.frequency, v.is_default, v.payment_url, v.notes, v.sort_order, true
FROM (VALUES
  (
    'e4000000-0000-4000-8000-000000000001'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'debito',
    'mensual',
    true,
    NULL::text,
    '[DEMO] Débito mensual. Dato de ejemplo, no vigente.',
    1
  ),
  (
    'e4000000-0000-4000-8000-000000000002'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'tarjeta_credito',
    'mensual',
    false,
    NULL::text,
    '[DEMO] Tarjeta de crédito mensual. Dato de ejemplo, no vigente.',
    2
  ),
  (
    'e4000000-0000-4000-8000-000000000003'::uuid,
    'd1000000-0000-4000-8000-000000000002'::uuid,
    'debito',
    'mensual',
    true,
    NULL::text,
    '[DEMO] Débito mensual. Dato de ejemplo, no vigente.',
    1
  )
) AS v(id, plan_version_id, method, frequency, is_default, payment_url, notes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_payment_modalities pm WHERE pm.id = v.id
);

INSERT INTO public.plan_coverage_ceilings (id, plan_version_id, scope, amount, service_category, notes, sort_order, is_demo)
SELECT v.id, v.plan_version_id, v.scope, v.amount, v.service_category, v.notes, v.sort_order, true
FROM (VALUES
  (
    'e5000000-0000-4000-8000-000000000001'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'por_anio',
    50000.00::numeric,
    NULL::text,
    '[DEMO] Techo de cobertura anual. Dato de ejemplo, no vigente.',
    1
  ),
  (
    'e5000000-0000-4000-8000-000000000002'::uuid,
    'd1000000-0000-4000-8000-000000000001'::uuid,
    'por_evento',
    10000.00::numeric,
    NULL::text,
    '[DEMO] Techo por evento. Dato de ejemplo, no vigente.',
    2
  ),
  (
    'e5000000-0000-4000-8000-000000000003'::uuid,
    'd1000000-0000-4000-8000-000000000002'::uuid,
    'por_anio',
    100000.00::numeric,
    NULL::text,
    '[DEMO] Techo de cobertura anual. Dato de ejemplo, no vigente.',
    1
  )
) AS v(id, plan_version_id, scope, amount, service_category, notes, sort_order)
WHERE NOT EXISTS (
  SELECT 1 FROM public.plan_coverage_ceilings cc WHERE cc.id = v.id
);

-- ---------------------------------------------------------------------------
-- 9) Immutability — same pattern as prevent_published_plan_version_update
-- ---------------------------------------------------------------------------
-- Conditions can be edited while their plan version is draft; once the version is
-- published the condition set is frozen (insert, update and delete are rejected).
-- Deleting the parent plan version still cascades, because the parent row is already
-- gone when the cascade fires and the status lookup returns no row.

CREATE OR REPLACE FUNCTION public.prevent_published_plan_condition_change()
RETURNS TRIGGER AS $$
DECLARE
  v_status TEXT;
BEGIN
  IF TG_OP IN ('UPDATE', 'DELETE') THEN
    SELECT pv.status INTO v_status
    FROM public.plan_versions pv
    WHERE pv.id = OLD.plan_version_id;

    IF v_status = 'published' THEN
      RAISE EXCEPTION 'Plan conditions are immutable once the plan version is published (%.%)',
        TG_TABLE_NAME, OLD.id;
    END IF;
  END IF;

  IF TG_OP IN ('INSERT', 'UPDATE') THEN
    v_status := NULL;

    SELECT pv.status INTO v_status
    FROM public.plan_versions pv
    WHERE pv.id = NEW.plan_version_id;

    IF v_status = 'published' THEN
      RAISE EXCEPTION 'Plan conditions cannot be added to a published plan version (%.%)',
        TG_TABLE_NAME, NEW.id;
    END IF;
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_deductibles_immutable ON public.plan_deductibles;
CREATE TRIGGER plan_deductibles_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.plan_deductibles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_plan_condition_change();

DROP TRIGGER IF EXISTS plan_coinsurance_immutable ON public.plan_coinsurance;
CREATE TRIGGER plan_coinsurance_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.plan_coinsurance
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_plan_condition_change();

DROP TRIGGER IF EXISTS plan_copays_immutable ON public.plan_copays;
CREATE TRIGGER plan_copays_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.plan_copays
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_plan_condition_change();

DROP TRIGGER IF EXISTS plan_payment_modalities_immutable ON public.plan_payment_modalities;
CREATE TRIGGER plan_payment_modalities_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.plan_payment_modalities
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_plan_condition_change();

DROP TRIGGER IF EXISTS plan_coverage_ceilings_immutable ON public.plan_coverage_ceilings;
CREATE TRIGGER plan_coverage_ceilings_immutable
  BEFORE INSERT OR UPDATE OR DELETE ON public.plan_coverage_ceilings
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_plan_condition_change();
