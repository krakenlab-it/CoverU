"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";
import { VISUAL_PACK_ICONS } from "@/lib/visual-pack/assets";
import { cn } from "@/lib/utils";

export const COVERAGE_ASSISTANT_TOGGLE_EVENT = "coveru:coverage-assistant-toggle";

type CoverageAssistantTriggerProps = {
  className?: string;
  /** When KLM-57 rail lands, wire `onToggle` to provider context. */
  onToggle?: () => void;
};

/**
 * App-shell entry for the coverage assistant right rail (KLM-57).
 * Dispatches a document event until the rail provider is merged.
 */
export function CoverageAssistantTrigger({
  className,
  onToggle,
}: CoverageAssistantTriggerProps) {
  function handleClick() {
    if (onToggle) {
      onToggle();
      return;
    }

    window.dispatchEvent(new CustomEvent(COVERAGE_ASSISTANT_TOGGLE_EVENT));
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className={cn("gap-2", className)}
      onClick={handleClick}
      aria-label="Abrir asistente de cobertura"
      data-testid="coverage-assistant-trigger"
    >
      <Image
        src={VISUAL_PACK_ICONS.navAssistant}
        alt=""
        width={20}
        height={20}
        aria-hidden
        className="size-5 shrink-0"
      />
      <span className="hidden sm:inline">Asistente</span>
    </Button>
  );
}
