-- Orphan rows (organization deleted, ON DELETE SET NULL) were readable by every
-- authenticated user. Tenant reads now require a matching organization.

DROP POLICY IF EXISTS "quotes_org_member_read" ON public.quotes;
CREATE POLICY "quotes_org_member_select" ON public.quotes
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
  );

DROP POLICY IF EXISTS "api_usage_logs_org_read" ON public.api_usage_logs;
CREATE POLICY "api_usage_logs_org_member_select" ON public.api_usage_logs
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
  );
