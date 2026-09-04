import {
  parseCoverageQuestion,
  type ParsedQuestion,
  type QuestionIntent,
} from "@/lib/coverage/question-parser";
import type { CoverageQaTurn } from "@/lib/coverage/agent/types";

const FOLLOW_UP_PATTERN =
  /\b(y si|ahora|entonces|para (?:ese|esa|el|la)|mismo|misma|cambia|cambiando)\b/i;

function overlaySlots(
  base: ParsedQuestion,
  next: ParsedQuestion,
): ParsedQuestion {
  return {
    intent: next.intent === "unknown" ? base.intent : next.intent,
    age: next.age ?? base.age,
    compareAges: next.compareAges ?? base.compareAges,
    gender: next.gender ?? base.gender,
    region: next.region ?? base.region,
    grupoAsegurado: next.grupoAsegurado ?? base.grupoAsegurado,
    maternidad: next.maternidad ?? base.maternidad,
    deductible: next.deductible ?? base.deductible,
    annualLimit: next.annualLimit ?? base.annualLimit,
    policyTopic: next.policyTopic ?? base.policyTopic,
  };
}

function inferFollowUpIntent(
  question: string,
  current: ParsedQuestion,
  memory: ParsedQuestion,
): QuestionIntent {
  if (current.intent !== "unknown") return current.intent;
  if (!FOLLOW_UP_PATTERN.test(question)) return current.intent;
  if (memory.intent !== "unknown") return memory.intent;
  if (memory.age != null || current.age != null) return "price_quote";
  return current.intent;
}

export function mergeQuestionSlots(
  history: CoverageQaTurn[] | undefined,
  currentQuestion: string,
): ParsedQuestion {
  const current = parseCoverageQuestion(currentQuestion);
  let memory: ParsedQuestion = {
    intent: "unknown",
  };

  for (const turn of history ?? []) {
    memory = overlaySlots(memory, parseCoverageQuestion(turn.question));
  }

  const merged = overlaySlots(memory, current);
  merged.intent = inferFollowUpIntent(currentQuestion, current, memory);
  return merged;
}
