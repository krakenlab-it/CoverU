-- Organization-level settings (rate limits, future feature flags)
-- Safe additive migration on top of Phase 1 schema.

CREATE TABLE IF NOT EXISTS public.organization_settings (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  rate_limit_requests INTEGER NOT NULL DEFAULT 100
    CHECK (rate_limit_requests > 0 AND rate_limit_requests <= 10000),
  rate_limit_window_ms INTEGER NOT NULL DEFAULT 60000
    CHECK (rate_limit_window_ms >= 1000 AND rate_limit_window_ms <= 86400000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.organization_settings ENABLE ROW LEVEL SECURITY;

-- Org members can read their organization's settings
CREATE POLICY "org_settings_member_read" ON public.organization_settings
  FOR SELECT TO authenticated
  USING (organization_id IN (SELECT public.user_organization_ids()));

-- Org admins/owners can update settings for their org
CREATE POLICY "org_settings_admin_update" ON public.organization_settings
  FOR UPDATE TO authenticated
  USING (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  )
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

-- Org admins/owners can insert settings for their org
CREATE POLICY "org_settings_admin_insert" ON public.organization_settings
  FOR INSERT TO authenticated
  WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM public.organization_members
      WHERE user_id = auth.uid()
        AND status = 'active'
        AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "org_settings_service_all" ON public.organization_settings
  FOR ALL TO service_role USING (true) WITH CHECK (true);
