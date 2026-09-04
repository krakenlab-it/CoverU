"use client";

import { useEffect } from "react";
import { useCoverageAssistantPanel } from "@/components/coverage/coverage-assistant-context";

type PlanCoverageAssistantBridgeProps = {
  planVersionId: string;
  planName: string;
};

export function PlanCoverageAssistantBridge({
  planVersionId,
  planName,
}: PlanCoverageAssistantBridgeProps) {
  const { setPlanContext } = useCoverageAssistantPanel();

  useEffect(() => {
    setPlanContext({ planVersionId, planName });
    return () => setPlanContext(null);
  }, [planVersionId, planName, setPlanContext]);

  return null;
}
