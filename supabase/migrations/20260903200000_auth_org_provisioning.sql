-- CoverU: auto-provision organization + owner membership on auth.users insert.
-- Idempotent: skips when the user already has an active membership.
-- Reads organization_name from raw_user_meta_data (signup options.data).

CREATE OR REPLACE FUNCTION public.slugify_org_name(input TEXT)
RETURNS TEXT
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT trim(both '-' FROM lower(regexp_replace(coalesce(input, 'org'), '[^a-zA-Z0-9]+', '-', 'g')));
$$;

CREATE OR REPLACE FUNCTION public.provision_user_organization(
  p_user_id UUID,
  p_organization_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user auth.users%ROWTYPE;
  v_org_name TEXT;
  v_slug TEXT;
  v_org_id UUID;
  v_suffix TEXT;
BEGIN
  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'user_id is required';
  END IF;

  IF EXISTS (
    SELECT 1
    FROM public.organization_members om
    WHERE om.user_id = p_user_id
      AND om.status = 'active'
  ) THEN
    SELECT om.organization_id
    INTO v_org_id
    FROM public.organization_members om
    WHERE om.user_id = p_user_id
      AND om.status = 'active'
    ORDER BY om.created_at ASC
    LIMIT 1;

    RETURN v_org_id;
  END IF;

  SELECT *
  INTO v_user
  FROM auth.users
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'user not found';
  END IF;

  v_org_name := NULLIF(trim(coalesce(
    p_organization_name,
    v_user.raw_user_meta_data ->> 'organization_name'
  )), '');

  IF v_org_name IS NULL THEN
    v_org_name := split_part(coalesce(v_user.email, 'usuario'), '@', 1);
  END IF;

  v_suffix := substr(replace(p_user_id::text, '-', ''), 1, 8);
  v_slug := public.slugify_org_name(v_org_name) || '-' || v_suffix;

  INSERT INTO public.organizations (name, slug, status, is_demo)
  VALUES (v_org_name, v_slug, 'active', false)
  ON CONFLICT (slug) DO UPDATE
    SET name = EXCLUDED.name,
        updated_at = now()
  RETURNING id INTO v_org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role, status)
  VALUES (v_org_id, p_user_id, 'owner', 'active')
  ON CONFLICT (organization_id, user_id) DO UPDATE
    SET role = 'owner',
        status = 'active';

  RETURN v_org_id;
END;
$$;

REVOKE ALL ON FUNCTION public.provision_user_organization(UUID, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_user_organization(UUID, TEXT) TO service_role;

CREATE OR REPLACE FUNCTION public.provision_my_organization(
  p_organization_name TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  RETURN public.provision_user_organization(v_user_id, p_organization_name);
END;
$$;

REVOKE ALL ON FUNCTION public.provision_my_organization(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.provision_my_organization(TEXT) TO authenticated;

CREATE OR REPLACE FUNCTION public.handle_auth_user_org_provisioning()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  PERFORM public.provision_user_organization(
    NEW.id,
    NULLIF(trim(NEW.raw_user_meta_data ->> 'organization_name'), '')
  );

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created_provision_org ON auth.users;

CREATE TRIGGER on_auth_user_created_provision_org
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_auth_user_org_provisioning();
