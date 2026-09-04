import type { CoverageQaProvider } from "@/lib/coverage/agent/types";

export function getCoverageQaProvider(): CoverageQaProvider {
  const configured = process.env.COVERAGE_QA_PROVIDER;
  if (configured === "openai" && process.env.OPENAI_API_KEY) {
    return "openai";
  }
  return "rules";
}
