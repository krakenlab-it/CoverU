-- Fix hybrid_search_policy_chunks on DBs that applied 20260904020000 before the
-- extensions-schema vector operator fix. Cover-U-DB prod received the same DDL
-- via MCP as version 20260904153721 (Steve).

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
SET search_path = public, extensions
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
        ORDER BY pc.embedding OPERATOR(extensions.<=>) query_embedding
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
