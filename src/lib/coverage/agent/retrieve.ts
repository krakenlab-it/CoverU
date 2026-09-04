import { createAdminClient } from "@/lib/supabase/admin";
import type { AgentContext, PolicyChunkRow } from "@/lib/coverage/qa-agent";
import { embedQueryText } from "@/lib/coverage/agent/embeddings";
import type { CoverageCitation, CoverageQaResult, CoverageStatus } from "@/lib/types/phase1";
import type { CoverageQaProvider } from "@/lib/coverage/agent/types";

export interface RetrievedChunk {
  id: string;
  clause_ref: string;
  content: string;
  policy_document_title: string;
  source: "lexical" | "vector" | "hybrid";
  score: number;
}

const RRF_K = 50;

export function chunksFromContext(context: AgentContext): PolicyChunkRow[] {
  if (context.chunks.length > 0) return context.chunks;

  return context.citations.map((citation, index) => ({
    id: `citation-${index}-${citation.clause_ref}`,
    clause_ref: citation.clause_ref,
    content: citation.excerpt,
    source_kind: "citation",
    policy_document_title: citation.policy_document_title,
  }));
}

export function lexicalSearchChunks(
  context: AgentContext,
  query: string,
  limit = 8,
): RetrievedChunk[] {
  const tokens = tokenize(query);
  if (tokens.length === 0) return [];

  return chunksFromContext(context)
    .map((chunk) => {
      const haystack = normalizeSearchText(
        `${chunk.clause_ref} ${chunk.content}`,
      );
      const overlap = tokens.filter((token) => haystack.includes(token)).length;
      const phraseBonus = haystack.includes(normalizeSearchText(query).trim())
        ? 2
        : 0;
      return {
        id: chunk.id,
        clause_ref: chunk.clause_ref ?? "cláusula",
        content: chunk.content,
        policy_document_title:
          chunk.policy_document_title ?? "Documento de póliza",
        source: "lexical" as const,
        score: overlap + phraseBonus,
      };
    })
    .filter((hit) => hit.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function fuseHybridRanks(
  lexical: RetrievedChunk[],
  vector: RetrievedChunk[],
  limit = 8,
): RetrievedChunk[] {
  const byId = new Map<string, RetrievedChunk>();
  for (const hit of [...lexical, ...vector]) {
    const existing = byId.get(hit.id);
    if (!existing || hit.score > existing.score) {
      byId.set(hit.id, { ...hit, source: "hybrid" });
    }
  }

  const lexicalRanks = toRanks(lexical);
  const vectorRanks = toRanks(vector);

  return [...byId.values()]
    .map((hit) => {
      const lexicalRank = lexicalRanks.get(hit.id);
      const vectorRank = vectorRanks.get(hit.id);
      const rrf =
        (lexicalRank ? 1 / (RRF_K + lexicalRank) : 0) +
        (vectorRank ? 1 / (RRF_K + vectorRank) : 0);
      return { ...hit, score: rrf };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

function toRanks(hits: RetrievedChunk[]): Map<string, number> {
  return new Map(
    hits.map((hit, index) => [hit.id, index + 1] satisfies [string, number]),
  );
}

function normalizeSearchText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function tokenize(query: string): string[] {
  return normalizeSearchText(query)
    .split(/\W+/)
    .filter((token) => token.length > 3);
}

interface VectorMatchRow {
  id: string;
  clause_ref: string | null;
  content: string;
  similarity: number;
  policy_document_title?: string | null;
  source_kind?: string;
}

export async function vectorSearchChunks(
  planVersionId: string,
  query: string,
  limit = 8,
): Promise<RetrievedChunk[]> {
  const embedding = await embedQueryText(query);
  if (!embedding) return [];

  const supabase = createAdminClient();
  if (!supabase) return [];

  const { data, error } = await supabase.rpc("hybrid_search_policy_chunks", {
    query_text: query,
    query_embedding: embedding,
    match_plan_version_id: planVersionId,
    match_count: limit,
  });

  if (error || !data) return [];

  return (data as VectorMatchRow[]).map((row) => ({
    id: row.id,
    clause_ref: row.clause_ref ?? "cláusula",
    content: row.content,
    policy_document_title: row.policy_document_title ?? "Documento de póliza",
    source: "vector" as const,
    score: row.similarity,
  }));
}

export async function hybridSearchPolicy(
  context: AgentContext,
  query: string,
  limit = 8,
): Promise<RetrievedChunk[]> {
  const lexical = lexicalSearchChunks(context, query, limit);
  const vector = await vectorSearchChunks(context.planVersion.id, query, limit);
  if (vector.length === 0) return lexical;
  if (lexical.length === 0) return vector;
  return fuseHybridRanks(lexical, vector, limit);
}

function inferStatusFromHits(
  context: AgentContext,
  hits: RetrievedChunk[],
): CoverageStatus {
  const joined = hits.map((hit) => hit.content.toLowerCase()).join(" ");
  const clause = context.clauses.find((row) =>
    hits.some(
      (hit) =>
        row.title.toLowerCase().includes(hit.clause_ref.toLowerCase()) ||
        hit.content.toLowerCase().includes(row.title.toLowerCase()) ||
        (row.category &&
          hit.content.toLowerCase().includes(row.category.replace(/_/g, " "))),
    ),
  );
  if (clause) return clause.coverage_status;
  if (/no se cubren|no incluye|exclu/.test(joined)) return "not_covered";
  if (/carencia|sujeto a|siempre que/.test(joined)) return "conditional";
  if (/tendrá derecho|están cubiertas|cubierta/.test(joined)) return "covered";
  return "unknown";
}

export function resultFromRetrievedChunks(
  context: AgentContext,
  hits: RetrievedChunk[],
  provider: CoverageQaProvider,
): CoverageQaResult {
  if (hits.length === 0) {
    return {
      status: "unknown",
      answer:
        "No encontré un fragmento de póliza lo bastante cercano a esa pregunta.",
      citations: [],
      matched_tariff: null,
      abstained: true,
      policy_wording_controls: true,
      provider,
    };
  }

  const citations: CoverageCitation[] = hits.slice(0, 4).map((hit) => ({
    clause_ref: hit.clause_ref,
    excerpt: hit.content,
    page_number: null,
    policy_document_title: hit.policy_document_title,
  }));

  const status = inferStatusFromHits(context, hits);
  const top = hits[0];

  return {
    status,
    answer: `${top.clause_ref}: ${top.content}`,
    citations,
    matched_tariff: null,
    abstained: false,
    policy_wording_controls: true,
    provider,
  };
}
