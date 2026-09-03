-- CoverU Phase 1: organizations, B2B API, plan versions, coverage catalog, quotes, usage logs
-- Extends PR #1 schema safely. All demo fixtures use is_demo = true and [DEMO] labels.

-- ---------------------------------------------------------------------------
-- Organizations & membership
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'archived')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS organizations_slug_idx ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS organizations_status_idx ON public.organizations(status);

CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'member'
    CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'invited', 'suspended')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS organization_members_user_id_idx
  ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS organization_members_org_id_idx
  ON public.organization_members(organization_id);

-- ---------------------------------------------------------------------------
-- B2B API clients & keys (hash + prefix only — never store raw keys)
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.api_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'suspended', 'revoked')),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_clients_org_id_idx ON public.api_clients(organization_id);

CREATE TABLE IF NOT EXISTS public.api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_client_id UUID NOT NULL REFERENCES public.api_clients(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'default',
  key_prefix TEXT NOT NULL,
  key_hash TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'revoked', 'expired')),
  scopes TEXT[] NOT NULL DEFAULT ARRAY['read:catalog', 'read:quotes'],
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (key_prefix)
);

CREATE INDEX IF NOT EXISTS api_keys_client_id_idx ON public.api_keys(api_client_id);
CREATE INDEX IF NOT EXISTS api_keys_prefix_idx ON public.api_keys(key_prefix);

-- ---------------------------------------------------------------------------
-- Immutable plan versions & coverage catalog
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.plan_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL CHECK (version_number > 0),
  label TEXT,
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'published', 'archived')),
  effective_from DATE,
  effective_to DATE,
  published_at TIMESTAMPTZ,
  changelog TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (plan_id, version_number)
);

CREATE INDEX IF NOT EXISTS plan_versions_plan_id_idx ON public.plan_versions(plan_id);
CREATE INDEX IF NOT EXISTS plan_versions_status_idx ON public.plan_versions(status);

-- Prevent updates to published plan versions (immutability)
CREATE OR REPLACE FUNCTION public.prevent_published_plan_version_update()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status = 'published' THEN
    RAISE EXCEPTION 'Published plan versions are immutable';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS plan_versions_immutable ON public.plan_versions;
CREATE TRIGGER plan_versions_immutable
  BEFORE UPDATE ON public.plan_versions
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_published_plan_version_update();

CREATE TABLE IF NOT EXISTS public.coverage_clauses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  coverage_status TEXT NOT NULL
    CHECK (coverage_status IN ('covered', 'not_covered', 'conditional')),
  conditions TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coverage_clauses_version_id_idx
  ON public.coverage_clauses(plan_version_id);

CREATE TABLE IF NOT EXISTS public.exclusions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS exclusions_version_id_idx ON public.exclusions(plan_version_id);

CREATE TABLE IF NOT EXISTS public.waiting_periods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  service_category TEXT NOT NULL,
  days INTEGER NOT NULL CHECK (days >= 0),
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS waiting_periods_version_id_idx
  ON public.waiting_periods(plan_version_id);

CREATE TABLE IF NOT EXISTS public.scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  expected_status TEXT
    CHECK (expected_status IN ('covered', 'not_covered', 'conditional', 'unknown')),
  notes TEXT,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS scenarios_version_id_idx ON public.scenarios(plan_version_id);

CREATE TABLE IF NOT EXISTS public.policy_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  document_type TEXT NOT NULL DEFAULT 'condiciones_generales',
  content TEXT NOT NULL,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_documents_version_id_idx
  ON public.policy_documents(plan_version_id);

CREATE TABLE IF NOT EXISTS public.citations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  policy_document_id UUID NOT NULL REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  clause_ref TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  page_number INTEGER,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS citations_document_id_idx ON public.citations(policy_document_id);

-- ---------------------------------------------------------------------------
-- Quotes & API usage audit
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.quotes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id),
  tariff_id UUID REFERENCES public.tariffs(id) ON DELETE SET NULL,
  external_ref TEXT,
  status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('draft', 'active', 'expired', 'accepted', 'cancelled')),
  age INTEGER CHECK (age >= 0 AND age <= 120),
  gender TEXT,
  region TEXT,
  monthly_price INTEGER CHECK (monthly_price > 0),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  expires_at TIMESTAMPTZ,
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS quotes_org_id_idx ON public.quotes(organization_id);
CREATE INDEX IF NOT EXISTS quotes_status_idx ON public.quotes(status);
CREATE INDEX IF NOT EXISTS quotes_external_ref_idx ON public.quotes(external_ref);

CREATE TABLE IF NOT EXISTS public.api_usage_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  api_key_id UUID REFERENCES public.api_keys(id) ON DELETE SET NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  request_id TEXT NOT NULL,
  method TEXT NOT NULL,
  path TEXT NOT NULL,
  status_code INTEGER,
  duration_ms INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS api_usage_logs_org_id_idx ON public.api_usage_logs(organization_id);
CREATE INDEX IF NOT EXISTS api_usage_logs_created_at_idx ON public.api_usage_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS api_usage_logs_request_id_idx ON public.api_usage_logs(request_id);

-- Extend plans with status for safe filtering
ALTER TABLE public.plans
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
    CHECK (status IN ('active', 'inactive', 'archived'));

CREATE INDEX IF NOT EXISTS plans_status_idx ON public.plans(status);

-- ---------------------------------------------------------------------------
-- Helper: current user's organization IDs
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_organization_ids()
RETURNS SETOF UUID AS $$
  SELECT organization_id
  FROM public.organization_members
  WHERE user_id = auth.uid()
    AND status = 'active';
$$ LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coverage_clauses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exclusions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waiting_periods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.policy_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_usage_logs ENABLE ROW LEVEL SECURITY;

-- Organizations: members can read their orgs
CREATE POLICY "organizations_member_read" ON public.organizations
  FOR SELECT TO authenticated
  USING (id IN (SELECT public.user_organization_ids()));

CREATE POLICY "organizations_service_all" ON public.organizations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Organization members: users see their own memberships
CREATE POLICY "org_members_self_read" ON public.organization_members
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "org_members_service_all" ON public.organization_members
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- API clients & keys: service role only (verified server-side)
CREATE POLICY "api_clients_service_all" ON public.api_clients
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "api_keys_service_all" ON public.api_keys
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Published catalog reads (safe public access to demo/published data)
CREATE POLICY "plan_versions_published_read" ON public.plan_versions
  FOR SELECT TO anon, authenticated
  USING (status = 'published' OR is_demo = true);

CREATE POLICY "plan_versions_service_all" ON public.plan_versions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "coverage_clauses_published_read" ON public.coverage_clauses
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "coverage_clauses_service_all" ON public.coverage_clauses
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "exclusions_published_read" ON public.exclusions
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "exclusions_service_all" ON public.exclusions
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "waiting_periods_published_read" ON public.waiting_periods
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "waiting_periods_service_all" ON public.waiting_periods
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "scenarios_published_read" ON public.scenarios
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "scenarios_service_all" ON public.scenarios
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "policy_documents_published_read" ON public.policy_documents
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "policy_documents_service_all" ON public.policy_documents
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE POLICY "citations_published_read" ON public.citations
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.policy_documents pd
      JOIN public.plan_versions pv ON pv.id = pd.plan_version_id
      WHERE pd.id = policy_document_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "citations_service_all" ON public.citations
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Quotes: org members read their org quotes; service role full access
CREATE POLICY "quotes_org_member_read" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id IN (SELECT public.user_organization_ids())
  );

CREATE POLICY "quotes_service_all" ON public.quotes
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- API usage logs: org members read their org logs; service role full access
CREATE POLICY "api_usage_logs_org_read" ON public.api_usage_logs
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id IN (SELECT public.user_organization_ids())
  );

CREATE POLICY "api_usage_logs_service_all" ON public.api_usage_logs
  FOR ALL TO service_role USING (true) WITH CHECK (true);
