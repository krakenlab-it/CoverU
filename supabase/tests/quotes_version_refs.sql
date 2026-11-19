-- KAN-231 acceptance checks against a thrown-away local Postgres.
-- Run after scripts/test-migrations-ephemeral.mjs:
--   psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f supabase/tests/quotes_version_refs.sql
-- Every check raises nothing on success and prints one "ok" row.
\set ON_ERROR_STOP on

BEGIN;

-- Fixture: a second published version of the demo plan, plus its own tariff row.
INSERT INTO public.plan_versions (id, plan_id, version_number, label, status, published_at, is_demo)
VALUES ('d1000000-0000-4000-8000-0000000000a2','b0000000-0000-4000-8000-000000000001',2,'[DEMO] v2','published','2026-11-01T00:00:00Z',true);

INSERT INTO public.tariffs (id, plan_id, plan_version_id, age_min, age_max, gender, region, monthly_price, is_demo)
VALUES ('c0000000-0000-4000-8000-0000000000a2','b0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-0000000000a2',18,65,'femenino','Sierra',150.00,true);

-- 1) Legacy demo quote is backfilled from tariff_id / plan_version_id.
DO $$
DECLARE r RECORD;
BEGIN
  SELECT * INTO r FROM public.quotes WHERE id = 'd8000000-0000-4000-8000-000000000001';
  IF r.tariff_version_id IS DISTINCT FROM r.tariff_id THEN
    RAISE EXCEPTION 'legacy quote tariff pin was not backfilled';
  END IF;
  IF r.plan_conditions_version_id IS DISTINCT FROM r.plan_version_id THEN
    RAISE EXCEPTION 'legacy quote conditions pin was not backfilled';
  END IF;
  RAISE NOTICE 'ok 1 legacy quote backfilled';
END $$;

-- 2) A quote can pin the tariff row and conditions version it was priced with.
INSERT INTO public.quotes (id, organization_id, plan_version_id, tariff_id, tariff_version_id, plan_conditions_version_id, status, age, gender, region, monthly_price, is_demo)
VALUES ('e9000000-0000-4000-8000-000000000001','d0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','active',30,'femenino','Sierra',12500,true);
DO $$ BEGIN RAISE NOTICE 'ok 2 quote records both versions'; END $$;

-- 3) A tariff row from another plan is rejected.
DO $$
BEGIN
  INSERT INTO public.quotes (id, organization_id, plan_version_id, tariff_id, tariff_version_id, status, age, monthly_price)
  VALUES ('e9000000-0000-4000-8000-0000000000ba','d0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000002','c0000000-0000-4000-8000-000000000002','active',30,12500);
  RAISE EXCEPTION 'a foreign-plan tariff pin was accepted';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'a foreign-plan%' THEN RAISE; END IF;
  RAISE NOTICE 'ok 3 foreign-plan tariff rejected';
END $$;

-- 4) A tariff row from another plan version is rejected.
DO $$
BEGIN
  INSERT INTO public.quotes (id, organization_id, plan_version_id, tariff_id, tariff_version_id, status, age, monthly_price)
  VALUES ('e9000000-0000-4000-8000-0000000000bb','d0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-0000000000a2','c0000000-0000-4000-8000-0000000000a2','active',30,12500);
  RAISE EXCEPTION 'a foreign-version tariff pin was accepted';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'a foreign-version%' THEN RAISE; END IF;
  RAISE NOTICE 'ok 4 foreign-version tariff rejected';
END $$;

-- 5) A conditions version of another plan is rejected.
DO $$
BEGIN
  INSERT INTO public.quotes (id, organization_id, plan_version_id, tariff_id, tariff_version_id, plan_conditions_version_id, status, age, monthly_price)
  VALUES ('e9000000-0000-4000-8000-0000000000bc','d0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','c0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000003','active',30,12500);
  RAISE EXCEPTION 'a foreign-plan conditions pin was accepted';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'a foreign-plan%' THEN RAISE; END IF;
  RAISE NOTICE 'ok 5 foreign-plan conditions rejected';
END $$;

-- 6) A recorded pin cannot be repointed.
DO $$
BEGIN
  UPDATE public.quotes SET tariff_version_id = 'c0000000-0000-4000-8000-0000000000a2'
  WHERE id = 'e9000000-0000-4000-8000-000000000001';
  RAISE EXCEPTION 'a recorded tariff pin was repointed';
EXCEPTION WHEN raise_exception THEN
  IF SQLERRM LIKE 'a recorded%' THEN RAISE; END IF;
  RAISE NOTICE 'ok 6 recorded pin is immutable';
END $$;

-- 7) Filling a NULL pin is still allowed (legacy backfill path).
INSERT INTO public.quotes (id, organization_id, plan_version_id, status, age, monthly_price)
VALUES ('e9000000-0000-4000-8000-0000000000bd','d0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001','active',30,12500);
UPDATE public.quotes
SET tariff_version_id = 'c0000000-0000-4000-8000-000000000001',
    plan_conditions_version_id = 'd1000000-0000-4000-8000-000000000001'
WHERE id = 'e9000000-0000-4000-8000-0000000000bd';
DO $$ BEGIN RAISE NOTICE 'ok 7 null pin can be filled'; END $$;

-- 8) Loading a new tariff does not change existing quotes.
CREATE TEMP TABLE before_reload ON COMMIT DROP AS
SELECT id, tariff_version_id, plan_conditions_version_id, monthly_price FROM public.quotes;

UPDATE public.tariffs SET monthly_price = 138.40
WHERE id = 'c0000000-0000-4000-8000-000000000001';

INSERT INTO public.tariffs (id, plan_id, plan_version_id, age_min, age_max, gender, region, monthly_price, is_demo)
VALUES ('c0000000-0000-4000-8000-0000000000b1','b0000000-0000-4000-8000-000000000001','d1000000-0000-4000-8000-000000000001',18,65,'femenino','Costa',141.10,true);

DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n
  FROM before_reload b
  JOIN public.quotes q USING (id)
  WHERE q.tariff_version_id IS DISTINCT FROM b.tariff_version_id
     OR q.plan_conditions_version_id IS DISTINCT FROM b.plan_conditions_version_id
     OR q.monthly_price IS DISTINCT FROM b.monthly_price;
  IF n <> 0 THEN
    RAISE EXCEPTION 'a new tariff load changed % existing quote(s)', n;
  END IF;
  RAISE NOTICE 'ok 8 tariff load leaves existing quotes untouched';
END $$;

-- 9) Re-quoting after the bump writes a new row that records both versions.
INSERT INTO public.quotes (id, organization_id, plan_version_id, tariff_id, tariff_version_id, plan_conditions_version_id, status, age, gender, region, monthly_price, is_demo, metadata)
SELECT
  'e9000000-0000-4000-8000-0000000000c1',
  'd0000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000001',
  'd1000000-0000-4000-8000-000000000001',
  'active', 30, 'femenino', 'Sierra',
  t.monthly_price, true,
  jsonb_build_object('re_quote_of', 'd8000000-0000-4000-8000-000000000001',
                     'previous_monthly_price', q.monthly_price)
FROM public.tariffs t, public.quotes q
WHERE t.id = 'c0000000-0000-4000-8000-000000000001'
  AND q.id = 'd8000000-0000-4000-8000-000000000001';

DO $$
DECLARE old_price NUMERIC; new_price NUMERIC;
BEGIN
  SELECT monthly_price INTO old_price FROM public.quotes WHERE id = 'd8000000-0000-4000-8000-000000000001';
  SELECT monthly_price INTO new_price FROM public.quotes WHERE id = 'e9000000-0000-4000-8000-0000000000c1';
  IF old_price = new_price THEN
    RAISE EXCEPTION 're-quote did not pick up the reloaded price';
  END IF;
  IF old_price <> 12500 THEN
    RAISE EXCEPTION 'original quote price moved on re-quote (%)', old_price;
  END IF;
  RAISE NOTICE 'ok 9 re-quote records the bump and keeps the original';
END $$;

-- 10) Deleting a pinned tariff nulls the pin instead of blocking catalog cleanup.
DELETE FROM public.tariffs WHERE id = 'c0000000-0000-4000-8000-0000000000b1';
DELETE FROM public.tariffs WHERE id = 'c0000000-0000-4000-8000-000000000001';
DO $$
DECLARE n INT;
BEGIN
  SELECT count(*) INTO n FROM public.quotes WHERE tariff_version_id = 'c0000000-0000-4000-8000-000000000001';
  IF n <> 0 THEN
    RAISE EXCEPTION 'deleted tariff left a dangling pin on % quote(s)', n;
  END IF;
  SELECT count(*) INTO n FROM public.quotes WHERE monthly_price = 12500;
  IF n = 0 THEN
    RAISE EXCEPTION 'quoted price snapshot was lost with the tariff row';
  END IF;
  RAISE NOTICE 'ok 10 tariff delete clears the pin and keeps the price snapshot';
END $$;

ROLLBACK;

SELECT 'ok all KAN-231 acceptance checks passed' AS result;
