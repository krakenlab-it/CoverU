-- CoverU KAN-252: LOPDP access log for client health data ("who viewed what, and when").
--
-- Append-only by construction:
--   * RLS is enabled and only SELECT (org admins) plus service-role INSERT/SELECT exist.
--     There is deliberately NO UPDATE and NO DELETE policy.
--   * A BEFORE UPDATE OR DELETE row trigger and a BEFORE TRUNCATE statement trigger reject
--     mutation for every role, including service_role.
--   * anon/authenticated lose UPDATE and DELETE at the privilege level.
--
-- Health-data column names are recorded, never plaintext field values. Values live
-- encrypted (AES-256-GCM) and are decrypted only by server code that writes here first.
--
-- Audit columns (actor_user_id, actor_api_key_id, subject_user_id) intentionally carry no
-- foreign key: an FK with ON DELETE SET NULL would rewrite history and ON DELETE CASCADE
-- would erase it, so the identifiers are stored as immutable value snapshots.

CREATE TABLE IF NOT EXISTS public.health_data_access_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE RESTRICT,
  actor_kind TEXT NOT NULL
    CHECK (actor_kind IN ('user', 'api_client', 'service', 'system')),
  actor_user_id UUID,
  actor_api_key_id UUID,
  actor_label TEXT,
  actor_role TEXT,
  resource_type TEXT NOT NULL
    CHECK (resource_type IN ('client_file', 'application', 'health_profile')),
  resource_id UUID NOT NULL,
  subject_user_id UUID,
  fields_accessed TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  access_kind TEXT NOT NULL
    CHECK (access_kind IN ('view', 'list', 'export', 'decrypt')),
  purpose TEXT,
  request_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT health_data_access_log_actor_binding CHECK (
    (actor_kind = 'user' AND actor_user_id IS NOT NULL)
    OR (actor_kind = 'api_client' AND actor_api_key_id IS NOT NULL)
    OR (actor_kind IN ('service', 'system') AND actor_label IS NOT NULL)
  ),
  CONSTRAINT health_data_access_log_actor_role_length CHECK (
    actor_role IS NULL OR length(actor_role) <= 32
  ),
  CONSTRAINT health_data_access_log_actor_label_length CHECK (
    actor_label IS NULL OR length(actor_label) <= 200
  ),
  CONSTRAINT health_data_access_log_purpose_length CHECK (
    purpose IS NULL OR length(purpose) <= 200
  ),
  CONSTRAINT health_data_access_log_fields_no_nulls CHECK (
    array_position(fields_accessed, NULL) IS NULL
  ),
  CONSTRAINT health_data_access_log_fields_bounded CHECK (
    cardinality(fields_accessed) <= 50
  )
);

COMMENT ON TABLE public.health_data_access_log IS
  'Append-only LOPDP audit trail: which actor viewed which client health resource, which fields, and when. Field names only — never values.';

COMMENT ON COLUMN public.health_data_access_log.fields_accessed IS
  'Health field names that were decrypted/returned. Values are never stored here.';

COMMENT ON COLUMN public.health_data_access_log.subject_user_id IS
  'Data subject (the person whose health data was accessed). No FK: audit identifiers are immutable snapshots.';

CREATE INDEX IF NOT EXISTS health_data_access_log_org_created_at_idx
  ON public.health_data_access_log(organization_id, created_at DESC);

CREATE INDEX IF NOT EXISTS health_data_access_log_subject_created_at_idx
  ON public.health_data_access_log(subject_user_id, created_at DESC)
  WHERE subject_user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS health_data_access_log_resource_idx
  ON public.health_data_access_log(resource_type, resource_id, created_at DESC);

-- ---------------------------------------------------------------------------
-- Append-only enforcement
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.prevent_health_data_access_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'public.health_data_access_log is append-only'
    USING ERRCODE = 'insufficient_privilege';
END;
$$;

DROP TRIGGER IF EXISTS health_data_access_log_append_only ON public.health_data_access_log;
CREATE TRIGGER health_data_access_log_append_only
  BEFORE UPDATE OR DELETE ON public.health_data_access_log
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_health_data_access_log_mutation();

DROP TRIGGER IF EXISTS health_data_access_log_append_only_truncate ON public.health_data_access_log;
CREATE TRIGGER health_data_access_log_append_only_truncate
  BEFORE TRUNCATE ON public.health_data_access_log
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.prevent_health_data_access_log_mutation();

-- ---------------------------------------------------------------------------
-- Org-admin helper (the access log is a compliance surface, not a member surface)
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.user_is_org_admin(p_organization_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.organization_id = p_organization_id
      AND om.user_id = auth.uid()
      AND om.status = 'active'
      AND om.role IN ('owner', 'admin')
  );
$$;

REVOKE ALL ON FUNCTION public.user_is_org_admin(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.user_is_org_admin(UUID) TO authenticated, service_role;

-- ---------------------------------------------------------------------------
-- Row Level Security — insert for the server, read for org admins. No UPDATE/DELETE policy.
-- ---------------------------------------------------------------------------

ALTER TABLE public.health_data_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "health_data_access_log_admin_select" ON public.health_data_access_log
  FOR SELECT TO authenticated
  USING (
    organization_id IN (SELECT public.user_organization_ids())
    AND public.user_is_org_admin(organization_id)
  );

CREATE POLICY "health_data_access_log_service_select" ON public.health_data_access_log
  FOR SELECT TO service_role
  USING (true);

CREATE POLICY "health_data_access_log_service_insert" ON public.health_data_access_log
  FOR INSERT TO service_role
  WITH CHECK (true);

REVOKE ALL ON public.health_data_access_log FROM anon;
REVOKE UPDATE, DELETE, TRUNCATE ON public.health_data_access_log FROM anon, authenticated;
REVOKE UPDATE, DELETE, TRUNCATE ON public.health_data_access_log FROM service_role;
GRANT SELECT ON public.health_data_access_log TO authenticated;
GRANT SELECT, INSERT ON public.health_data_access_log TO service_role;
