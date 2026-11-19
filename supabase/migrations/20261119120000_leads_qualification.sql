-- KAN-239 — Qualification fields, human-follow-up flag and consent capture on public.leads.
-- Additive only: every column is nullable or has a default, so existing rows and the
-- current /api/leads insert path keep working while the quoter form is rolled out.
-- No new table is created, so no new RLS policy is required: leads already runs with
-- RLS enabled and service-role-only read/insert (20250101000000_initial_schema.sql).

ALTER TABLE public.leads
  -- Qualification profile captured by the public quoter lead form.
  ADD COLUMN IF NOT EXISTS dependents INTEGER
    CHECK (dependents IS NULL OR (dependents >= 0 AND dependents <= 20)),
  ADD COLUMN IF NOT EXISTS city TEXT,
  -- Monthly budget the visitor states, USD, tax included (same unit as tariffs.monthly_price).
  ADD COLUMN IF NOT EXISTS budget NUMERIC(12, 2)
    CHECK (budget IS NULL OR budget >= 0),
  ADD COLUMN IF NOT EXISTS current_insurance TEXT,
  -- Set by the API when the visitor uses "Hablar con un asesor"; never set by the client.
  ADD COLUMN IF NOT EXISTS needs_human_followup BOOLEAN NOT NULL DEFAULT false,
  -- Consent gate. Copy is a placeholder pending approved LOPDP text (KAN-238);
  -- the version records which label the visitor accepted.
  ADD COLUMN IF NOT EXISTS consent_granted BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS consent_version TEXT,
  ADD COLUMN IF NOT EXISTS consent_granted_at TIMESTAMPTZ,
  -- Which form produced the lead: contacto, cotizador quote request, or advisor request.
  ADD COLUMN IF NOT EXISTS intent TEXT NOT NULL DEFAULT 'contact'
    CHECK (intent IN ('contact', 'quote', 'advisor'));

-- Advisor requests are the human work queue; quote requests are read in bulk by date.
CREATE INDEX IF NOT EXISTS leads_human_followup_idx
  ON public.leads(created_at DESC)
  WHERE needs_human_followup;

COMMENT ON COLUMN public.leads.dependents IS
  'Number of dependents declared in the quoter lead form (0-20).';
COMMENT ON COLUMN public.leads.city IS
  'Free-text city declared by the visitor; Ecuador has no closed list enforced here.';
COMMENT ON COLUMN public.leads.budget IS
  'Visitor-stated monthly budget in USD, tax included. Nullable when not declared.';
COMMENT ON COLUMN public.leads.current_insurance IS
  'Insurer the visitor declares today, or "Ninguno" when uninsured.';
COMMENT ON COLUMN public.leads.needs_human_followup IS
  'True for "Hablar con un asesor" leads; derived server-side from intent.';
COMMENT ON COLUMN public.leads.consent_granted IS
  'True only when the visitor ticked the consent gate; /api/leads rejects leads without it.';
COMMENT ON COLUMN public.leads.consent_version IS
  'Identifier of the consent label the visitor accepted.';
COMMENT ON COLUMN public.leads.intent IS
  'contact = contact page, quote = quoter lead form, advisor = talk-to-an-advisor request.';
