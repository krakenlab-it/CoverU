-- CoverÜ coverage agent: pgvector hybrid search + run traces
-- vector lives in the extensions schema (Supabase convention).

CREATE EXTENSION IF NOT EXISTS vector WITH SCHEMA extensions;

CREATE TABLE IF NOT EXISTS public.policy_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_version_id UUID NOT NULL REFERENCES public.plan_versions(id) ON DELETE CASCADE,
  policy_document_id UUID REFERENCES public.policy_documents(id) ON DELETE CASCADE,
  citation_id UUID REFERENCES public.citations(id) ON DELETE SET NULL,
  clause_ref TEXT,
  content TEXT NOT NULL,
  source_kind TEXT NOT NULL
    CHECK (source_kind IN ('citation', 'clause', 'document')),
  fts TSVECTOR GENERATED ALWAYS AS (to_tsvector('spanish', content)) STORED,
  embedding extensions.vector(1536),
  is_demo BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS policy_chunks_plan_version_id_idx
  ON public.policy_chunks(plan_version_id);

CREATE INDEX IF NOT EXISTS policy_chunks_citation_id_idx
  ON public.policy_chunks(citation_id);

CREATE INDEX IF NOT EXISTS policy_chunks_fts_idx
  ON public.policy_chunks USING gin(fts);

CREATE INDEX IF NOT EXISTS policy_chunks_embedding_hnsw_idx
  ON public.policy_chunks
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

COMMENT ON TABLE public.policy_chunks IS
  'Retrievable policy fragments for hybrid keyword + pgvector search. Filter by plan_version_id inside the RPC, not after rpc().';

COMMENT ON COLUMN public.policy_chunks.embedding IS
  'OpenAI text-embedding-3-small (1536). Same model must be used for queries.';

CREATE OR REPLACE FUNCTION public.hybrid_search_policy_chunks(
  query_text TEXT,
  match_plan_version_id UUID,
  query_embedding extensions.vector(1536) DEFAULT NULL,
  match_count INTEGER DEFAULT 8,
  full_text_weight FLOAT DEFAULT 1,
  semantic_weight FLOAT DEFAULT 1,
  rrf_k INTEGER DEFAULT 50
)
RETURNS TABLE (
  id UUID,
  clause_ref TEXT,
  content TEXT,
  policy_document_id UUID,
  source_kind TEXT,
  similarity DOUBLE PRECISION
)
LANGUAGE sql
STABLE
SET search_path = public
AS $$
  WITH full_text AS (
    SELECT
      pc.id,
      ROW_NUMBER() OVER (
        ORDER BY ts_rank_cd(pc.fts, websearch_to_tsquery('spanish', query_text)) DESC
      ) AS rank_ix
    FROM public.policy_chunks pc
    WHERE pc.plan_version_id = match_plan_version_id
      AND query_text IS NOT NULL
      AND length(btrim(query_text)) > 0
      AND pc.fts @@ websearch_to_tsquery('spanish', query_text)
    ORDER BY rank_ix
    LIMIT LEAST(match_count, 30) * 2
  ),
  semantic AS (
    SELECT
      pc.id,
      ROW_NUMBER() OVER (
        ORDER BY pc.embedding <=> query_embedding
      ) AS rank_ix
    FROM public.policy_chunks pc
    WHERE pc.plan_version_id = match_plan_version_id
      AND query_embedding IS NOT NULL
      AND pc.embedding IS NOT NULL
    ORDER BY rank_ix
    LIMIT LEAST(match_count, 30) * 2
  )
  SELECT
    pc.id,
    pc.clause_ref,
    pc.content,
    pc.policy_document_id,
    pc.source_kind,
    (
      COALESCE(1.0 / (rrf_k + full_text.rank_ix), 0.0) * full_text_weight +
      COALESCE(1.0 / (rrf_k + semantic.rank_ix), 0.0) * semantic_weight
    )::DOUBLE PRECISION AS similarity
  FROM full_text
  FULL OUTER JOIN semantic ON full_text.id = semantic.id
  JOIN public.policy_chunks pc
    ON COALESCE(full_text.id, semantic.id) = pc.id
  ORDER BY similarity DESC
  LIMIT LEAST(match_count, 30);
$$;

GRANT EXECUTE ON FUNCTION public.hybrid_search_policy_chunks(
  text,
  uuid,
  extensions.vector,
  integer,
  double precision,
  double precision,
  integer
) TO service_role, authenticated;

ALTER TABLE public.policy_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "policy_chunks_published_read" ON public.policy_chunks
  FOR SELECT TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.plan_versions pv
      WHERE pv.id = plan_version_id
        AND (pv.status = 'published' OR pv.is_demo = true)
    )
  );

CREATE POLICY "policy_chunks_service_all" ON public.policy_chunks
  FOR ALL TO service_role USING (true) WITH CHECK (true);

CREATE TABLE IF NOT EXISTS public.coverage_agent_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
  request_id TEXT,
  plan_version_id UUID REFERENCES public.plan_versions(id) ON DELETE SET NULL,
  plan_id UUID REFERENCES public.plans(id) ON DELETE SET NULL,
  question TEXT NOT NULL,
  parsed_intent TEXT,
  parsed_slots JSONB NOT NULL DEFAULT '{}'::jsonb,
  provider TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK (status IN (
      'queued',
      'loading_context',
      'planning',
      'tool_running',
      'synthesizing',
      'completed',
      'abstained',
      'failed'
    )),
  result_status TEXT,
  answer TEXT,
  abstained BOOLEAN NOT NULL DEFAULT false,
  events JSONB NOT NULL DEFAULT '[]'::jsonb,
  tool_calls JSONB NOT NULL DEFAULT '[]'::jsonb,
  duration_ms INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS coverage_agent_runs_org_id_idx
  ON public.coverage_agent_runs(organization_id);

CREATE INDEX IF NOT EXISTS coverage_agent_runs_plan_version_id_idx
  ON public.coverage_agent_runs(plan_version_id);

CREATE INDEX IF NOT EXISTS coverage_agent_runs_created_at_idx
  ON public.coverage_agent_runs(created_at DESC);

ALTER TABLE public.coverage_agent_runs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "coverage_agent_runs_org_read" ON public.coverage_agent_runs
  FOR SELECT TO authenticated
  USING (
    organization_id IS NULL
    OR organization_id IN (SELECT public.user_organization_ids())
  );

CREATE POLICY "coverage_agent_runs_service_all" ON public.coverage_agent_runs
  FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Seed searchable chunks from the existing demo citations (embeddings stay null until a key is present).
INSERT INTO public.policy_chunks (
  id,
  plan_version_id,
  policy_document_id,
  citation_id,
  clause_ref,
  content,
  source_kind,
  is_demo
)
SELECT
  ('d8000000-0000-4000-8000-' || RIGHT(c.id::text, 12))::uuid,
  pd.plan_version_id,
  c.policy_document_id,
  c.id,
  c.clause_ref,
  c.excerpt,
  'citation',
  c.is_demo
FROM public.citations c
JOIN public.policy_documents pd ON pd.id = c.policy_document_id
WHERE c.is_demo = true
ON CONFLICT (id) DO NOTHING;
