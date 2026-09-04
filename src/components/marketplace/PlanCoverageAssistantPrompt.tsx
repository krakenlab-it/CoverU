"use client";

import { useCoverageAssistantPanel } from "@/components/coverage/coverage-assistant-context";
import { Button } from "@/components/ui/button";
import { MessageSquareText } from "lucide-react";

type PlanCoverageAssistantPromptProps = {
  planName: string;
};

export function PlanCoverageAssistantPrompt({
  planName,
}: PlanCoverageAssistantPromptProps) {
  const { open } = useCoverageAssistantPanel();

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-background p-4">
      <div>
        <p className="font-medium text-foreground">¿Dudas sobre coberturas?</p>
        <p className="text-sm text-muted-foreground">
          Pregunta al asistente sobre{" "}
          <strong className="text-foreground">{planName}</strong> desde el
          panel lateral.
        </p>
      </div>
      <Button
        type="button"
        variant="brand"
        size="sm"
        className="gap-2"
        onClick={open}
      >
        <MessageSquareText className="size-4" aria-hidden="true" />
        Abrir asistente
      </Button>
    </div>
  );
}
