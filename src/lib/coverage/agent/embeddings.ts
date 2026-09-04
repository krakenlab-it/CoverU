export const COVERAGE_EMBEDDING_MODEL = "text-embedding-3-small";
export const COVERAGE_EMBEDDING_DIMENSIONS = 1536;

export async function embedQueryText(
  text: string,
): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return null;

  const response = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: process.env.COVERAGE_EMBEDDING_MODEL ?? COVERAGE_EMBEDDING_MODEL,
      input: text.slice(0, 8000),
      dimensions: COVERAGE_EMBEDDING_DIMENSIONS,
    }),
  });

  if (!response.ok) return null;

  const payload = (await response.json()) as {
    data?: Array<{ embedding?: number[] }>;
  };
  const embedding = payload.data?.[0]?.embedding;
  if (!embedding || embedding.length === 0) return null;
  return embedding;
}
