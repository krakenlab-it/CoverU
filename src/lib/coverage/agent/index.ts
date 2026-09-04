export { answerCoverageQuestion, runCoverageHarness } from "@/lib/coverage/agent/harness";
export { getCoverageQaProvider } from "@/lib/coverage/agent/provider";
export { packAgentContext } from "@/lib/coverage/agent/context-pack";
export { mergeQuestionSlots } from "@/lib/coverage/agent/slot-memory";
export {
  hybridSearchPolicy,
  lexicalSearchChunks,
  fuseHybridRanks,
} from "@/lib/coverage/agent/retrieve";
export type {
  CoverageQaInput,
  CoverageAgentAnswer,
  AgentRunSnapshot,
} from "@/lib/coverage/agent/types";
