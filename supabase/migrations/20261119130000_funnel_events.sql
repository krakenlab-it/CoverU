-- KAN-240 — Funnel events (lead > quote > advisor request).
-- Additive only: one new table, no change to any existing object.
--
-- The payload is a strict allowlist, not a free-form document: every field is a
-- typed column with a CHECK constraint, and there is deliberately no JSONB
-- column, so a health field cannot be persisted even by a buggy caller.
-- Only the steps that exist today are accepted: lead, quote and the advisor
-- request from KAN-239. Proposal, application, payment and policy are blocked
-- (KAN-242 to KAN-245), so no event type is reserved for them.

CREATE TABLE IF NOT EXISTS public.funnel_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for events produced by the public site, which has no tenant.
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  step TEXT NOT NULL
    CHECK (step IN ('lead', 'quote', 'advisor_request')),
  -- Which surface produced the event; each step allows only its own sources.
  source TEXT NOT NULL
    CHECK (source IN ('contacto', 'cotizador', 'compare', 'api')),
  -- Lead step only: the intent the visitor chose. Never free text.
  lead_intent TEXT
    CHECK (lead_intent IS NULL OR lead_intent IN ('contact', 'quote', 'advisor')),
  -- Quote step only: how many plans the profile priced. Null for API quote reads.
  offer_count INTEGER
    CHECK (offer_count IS NULL OR offer_count >= 0),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Column discipline per step: an event can only carry the field its step owns.
  CONSTRAINT funnel_events_step_columns CHECK (
    (step = 'lead'
      AND lead_intent IS NOT NULL
      AND offer_count IS NULL)
    OR (step = 'quote'
      AND lead_intent IS NULL)
    OR (step = 'advisor_request'
      AND lead_intent IS NULL
      AND offer_count IS NULL)
  ),
  -- The contact form only ever produces contact leads; advisor requests only
  -- come from the quoter. API events are quote reads.
  CONSTRAINT funnel_events_step_source CHECK (
    (step = 'lead' AND source IN ('contacto', 'cotizador'))
    OR (step = 'quote' AND source IN ('compare', 'api'))
    OR (step = 'advisor_request' AND source = 'cotizador')
  )
);

CREATE INDEX IF NOT EXISTS funnel_events_created_at_idx
  ON public.funnel_events(created_at DESC);

CREATE INDEX IF NOT EXISTS funnel_events_step_created_at_idx
  ON public.funnel_events(step, created_at DESC);

CREATE INDEX IF NOT EXISTS funnel_events_org_created_at_idx
  ON public.funnel_events(organization_id, created_at DESC)
  WHERE organization_id IS NOT NULL;

ALTER TABLE public.funnel_events ENABLE ROW LEVEL SECURITY;

-- Org members read their organization's events plus the unattributed public
-- funnel (same posture as quotes_org_member_read), never another tenant's rows.
CREATE POLICY "funnel_events_org_read" ON public.funnel_events
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id IN (SELECT public.user_organization_ids())
  );

CREATE POLICY "funnel_events_service_all" ON public.funnel_events
  FOR ALL TO service_role USING (true) WITH CHECK (true);

COMMENT ON TABLE public.funnel_events IS
  'One row per funnel step occurrence. Typed columns only: the payload cannot carry free-form or health data.';
COMMENT ON COLUMN public.funnel_events.step IS
  'lead = contact captured, quote = a profile was priced, advisor_request = a human was requested.';
COMMENT ON COLUMN public.funnel_events.source IS
  'Surface that produced the event: contact form, public quoter, public comparer or the B2B API.';
COMMENT ON COLUMN public.funnel_events.lead_intent IS
  'Intent chosen on the lead form; null for non-lead steps.';
COMMENT ON COLUMN public.funnel_events.offer_count IS
  'Plans priced for the profile; null when the quote step came from an API quote read.';
