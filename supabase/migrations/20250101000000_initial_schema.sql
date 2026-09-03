-- CoverU initial schema: insurers, plans, tariffs, leads
-- All demo seed data is clearly marked with is_demo = true

-- Insurers
CREATE TABLE IF NOT EXISTS public.insurers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Plans
CREATE TABLE IF NOT EXISTS public.plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  insurer_id UUID NOT NULL REFERENCES public.insurers(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  coverage_summary TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS plans_insurer_id_idx ON public.plans(insurer_id);

-- Tariffs
CREATE TABLE IF NOT EXISTS public.tariffs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  age_min INTEGER NOT NULL CHECK (age_min >= 0),
  age_max INTEGER NOT NULL CHECK (age_max >= age_min),
  gender TEXT NOT NULL CHECK (gender IN ('femenino', 'masculino', 'any')),
  region TEXT NOT NULL,
  monthly_price INTEGER NOT NULL CHECK (monthly_price > 0),
  deductible INTEGER,
  copay_pct INTEGER CHECK (copay_pct >= 0 AND copay_pct <= 100),
  annual_limit INTEGER,
  exclusions JSONB DEFAULT '[]'::jsonb,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS tariffs_plan_id_idx ON public.tariffs(plan_id);
CREATE INDEX IF NOT EXISTS tariffs_lookup_idx ON public.tariffs(gender, region, age_min, age_max);

-- Leads
CREATE TABLE IF NOT EXISTS public.leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  age INTEGER CHECK (age >= 0 AND age <= 120),
  gender TEXT,
  region TEXT,
  source TEXT,
  plan_interest TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS leads_created_at_idx ON public.leads(created_at DESC);

-- Row Level Security
ALTER TABLE public.insurers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tariffs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Public read for catalog tables (insurers, plans, tariffs)
CREATE POLICY "insurers_public_read" ON public.insurers
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "plans_public_read" ON public.plans
  FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "tariffs_public_read" ON public.tariffs
  FOR SELECT TO anon, authenticated USING (true);

-- Leads: insert only via service role (API route); no public read
CREATE POLICY "leads_service_insert" ON public.leads
  FOR INSERT TO service_role WITH CHECK (true);

CREATE POLICY "leads_service_read" ON public.leads
  FOR SELECT TO service_role USING (true);
