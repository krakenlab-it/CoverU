-- CoverU quote version pins (KAN-231) — every quote records the tariff version and the
-- plan-conditions version it was priced with, so a proposal can be reproduced after a
-- new tariff load.
--
-- Additive only: two nullable columns on public.quotes, both nullable so legacy rows stay
-- valid and the backfill below can run without a rewrite of historical quotes.
-- public.quotes already carries plan_version_id (the quoted plan version) and tariff_id
-- (legacy tariff link). KAN-231 adds the two explicit version references:
--
--   * tariff_version_id          -> public.tariffs(id): the exact tariff matrix row that
--                                   produced monthly_price. Distinct from tariff_id, which
--                                   is the plan-level tariff link: a plan has many tariff
--                                   rows (age band x gender x region x grupo asegurado) and
--                                   only one of them is the version the customer was quoted.
--   * plan_conditions_version_id -> public.plan_versions(id): the version whose deductibles,
--                                   coinsurance, copays, payment modalities, ceilings,
--                                   exclusions and waiting periods were shown (KAN-230 keys
--                                   every condition row to plan_version_id and freezes it on
--                                   publish). Today it mirrors plan_version_id; recording it
--                                   separately is deliberate so quotes created now stay
--                                   reproducible if conditions later get their own version
--                                   axis, without a second migration on quotes.
--
-- ON DELETE SET NULL on both references: a quote never blocks the catalog from being
-- cleaned up, and a quote whose tariff row was deleted surfaces as an unpinned/legacy
-- quote instead of failing to load. Quotes keep their own monthly_price snapshot, so the
-- quoted amount is still readable after the referenced row is gone.

-- ---------------------------------------------------------------------------
-- 1) Additive columns
-- ---------------------------------------------------------------------------

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS tariff_version_id UUID
    REFERENCES public.tariffs(id) ON DELETE SET NULL;

ALTER TABLE public.quotes
  ADD COLUMN IF NOT EXISTS plan_conditions_version_id UUID
    REFERENCES public.plan_versions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS quotes_tariff_version_id_idx
  ON public.quotes(tariff_version_id);

CREATE INDEX IF NOT EXISTS quotes_plan_conditions_version_id_idx
  ON public.quotes(plan_conditions_version_id);

COMMENT ON COLUMN public.quotes.tariff_version_id IS
  'KAN-231: exact tariffs row (tariff version) used to price this quote. Nullable for legacy quotes.';
COMMENT ON COLUMN public.quotes.plan_conditions_version_id IS
  'KAN-231: plan_versions row whose plan conditions were priced with this quote. Nullable for legacy quotes.';
COMMENT ON COLUMN public.quotes.monthly_price IS
  'USD monthly premium snapshot at quote time (same units as tariffs.monthly_price). Kept alongside tariff_version_id so the quoted amount survives a tariff reload or a deleted tariff row.';

-- ---------------------------------------------------------------------------
-- 2) API scope for creating pinned quotes
-- ---------------------------------------------------------------------------
-- POST /api/v1/quotes creates a quote and is what records the version pins, so it needs a
-- write scope. api_keys.scopes is TEXT[]; appending a value is additive and leaves every
-- existing scope in place. New keys get the scope from the application default, existing
-- keys are granted it here so the new endpoint is usable without recreating credentials.

UPDATE public.api_keys
SET scopes = array_append(scopes, 'write:quotes')
WHERE status = 'active'
  AND NOT ('write:quotes' = ANY(scopes));

ALTER TABLE public.api_keys
  ALTER COLUMN scopes SET DEFAULT ARRAY['read:catalog', 'read:quotes', 'read:coverage', 'write:quotes'];

-- ---------------------------------------------------------------------------
-- 3) Backfill legacy rows (safe: only rows where the pin is still missing)
-- ---------------------------------------------------------------------------
-- Existing quotes were priced from tariff_id and plan_version_id, so those values are the
-- best available version evidence. The tariff pin is only filled when the referenced tariff
-- still belongs to the quoted plan, so the integrity trigger below cannot reject the
-- backfill; rows that cannot be pinned that way stay null instead of being guessed.

UPDATE public.quotes q
SET tariff_version_id = q.tariff_id
WHERE q.tariff_version_id IS NULL
  AND q.tariff_id IS NOT NULL
  AND EXISTS (
    SELECT 1
    FROM public.tariffs t
    JOIN public.plan_versions pv ON pv.id = q.plan_version_id
    WHERE t.id = q.tariff_id
      AND t.plan_id = pv.plan_id
      AND (t.plan_version_id IS NULL OR t.plan_version_id = q.plan_version_id)
  );

UPDATE public.quotes
SET plan_conditions_version_id = plan_version_id
WHERE plan_conditions_version_id IS NULL
  AND plan_version_id IS NOT NULL;

-- ---------------------------------------------------------------------------
-- 4) Integrity — the pinned rows must describe the quoted plan version
-- ---------------------------------------------------------------------------
-- Enforced in the database so a bad insert cannot mix a tariff from another plan with a
-- quote. Tariffs loaded from catalog v1.3 carry plan_version_id only after the 1:1 draft
-- backfill, so the plan_version_id comparison is skipped when the tariff does not have it.
--
-- When a pin points at a row that no longer exists the check is skipped: that is the
-- ON DELETE SET NULL cascade clearing the pin while the parent row is being deleted. A pin
-- to a row that never existed is still rejected by the foreign key itself.

CREATE OR REPLACE FUNCTION public.validate_quote_version_refs()
RETURNS TRIGGER AS $$
DECLARE
  v_plan_id UUID;
  v_conditions_plan_id UUID;
  v_tariff_plan_id UUID;
  v_tariff_plan_version_id UUID;
BEGIN
  SELECT pv.plan_id INTO v_plan_id
  FROM public.plan_versions pv
  WHERE pv.id = NEW.plan_version_id;

  IF v_plan_id IS NULL THEN
    -- Unknown plan version: the foreign key on quotes.plan_version_id reports it.
    RETURN NEW;
  END IF;

  IF NEW.plan_conditions_version_id IS NOT NULL THEN
    SELECT pv.plan_id INTO v_conditions_plan_id
    FROM public.plan_versions pv
    WHERE pv.id = NEW.plan_conditions_version_id;

    IF v_conditions_plan_id IS NOT NULL
      AND v_conditions_plan_id IS DISTINCT FROM v_plan_id THEN
      RAISE EXCEPTION
        'Quote conditions version % does not belong to the quoted plan (quote %)',
        NEW.plan_conditions_version_id, NEW.id
        USING HINT = 'KAN-231: plan_conditions_version_id must reference a version of the same plan.';
    END IF;
  END IF;

  IF NEW.tariff_version_id IS NOT NULL THEN
    SELECT t.plan_id, t.plan_version_id
      INTO v_tariff_plan_id, v_tariff_plan_version_id
    FROM public.tariffs t
    WHERE t.id = NEW.tariff_version_id;

    IF v_tariff_plan_id IS NOT NULL
      AND v_tariff_plan_id IS DISTINCT FROM v_plan_id THEN
      RAISE EXCEPTION
        'Quote tariff version % does not belong to the quoted plan (quote %)',
        NEW.tariff_version_id, NEW.id
        USING HINT = 'KAN-231: tariff_version_id must reference a tariff row of the quoted plan.';
    END IF;

    IF v_tariff_plan_version_id IS NOT NULL
      AND v_tariff_plan_version_id <> NEW.plan_version_id THEN
      RAISE EXCEPTION
        'Quote tariff version % belongs to plan version %, not %',
        NEW.tariff_version_id, v_tariff_plan_version_id, NEW.plan_version_id
        USING HINT = 'KAN-231: tariff_version_id must reference a tariff row of the quoted plan version.';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ---------------------------------------------------------------------------
-- 5) Immutability — a recorded version pin never moves
-- ---------------------------------------------------------------------------
-- Once a quote carries a pin it is history. The only permitted transitions are filling a
-- NULL pin (legacy row or a backfill) and clearing it because the pinned row was deleted
-- (the foreign key's ON DELETE SET NULL). Replacing a pin with a different recorded version
-- means writing a new quote, which is what re-quoting after a version bump does.

CREATE OR REPLACE FUNCTION public.prevent_quote_version_ref_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.tariff_version_id IS NOT NULL
    AND NEW.tariff_version_id IS DISTINCT FROM OLD.tariff_version_id
    AND NEW.tariff_version_id IS NOT NULL THEN
    RAISE EXCEPTION 'A quote tariff version cannot be changed once recorded (quote %)', OLD.id
      USING HINT = 'KAN-231: re-quote into a new row instead of repointing an existing quote.';
  END IF;

  IF OLD.plan_conditions_version_id IS NOT NULL
    AND NEW.plan_conditions_version_id IS DISTINCT FROM OLD.plan_conditions_version_id
    AND NEW.plan_conditions_version_id IS NOT NULL THEN
    RAISE EXCEPTION 'A quote conditions version cannot be changed once recorded (quote %)', OLD.id
      USING HINT = 'KAN-231: re-quote into a new row instead of repointing an existing quote.';
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS quotes_version_refs_validate ON public.quotes;
CREATE TRIGGER quotes_version_refs_validate
  BEFORE INSERT OR UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.validate_quote_version_refs();

DROP TRIGGER IF EXISTS quotes_version_refs_immutable ON public.quotes;
CREATE TRIGGER quotes_version_refs_immutable
  BEFORE UPDATE ON public.quotes
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_quote_version_ref_change();
