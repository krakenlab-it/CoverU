"use client";

import Image from "next/image";
import { useCoverageAssistantPanel } from "@/components/coverage/coverage-assistant-context";
import { Button } from "@/components/ui/button";
import { VISUAL_PACK_ICONS } from "@/lib/visual-pack/assets";
import { cn } from "@/lib/utils";

export function CoverageAssistantTrigger({
  className,
}: {
  className?: string;
}) {
  const { isOpen, toggle, planContext } = useCoverageAssistantPanel();

  return (
    <Button
      type="button"
      variant={isOpen ? "secondary" : "outline"}
      size="sm"
      className={cn("gap-2", className)}
      onClick={toggle}
      aria-expanded={isOpen}
      aria-controls="coverage-assistant-desktop-panel coverage-assistant-mobile-panel"
      aria-label={
        isOpen
          ? "Contraer asistente de cobertura"
          : "Abrir asistente de cobertura"
      }
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
      {planContext ? (
        <span className="hidden max-w-[10rem] truncate text-xs text-muted-foreground md:inline">
          · {planContext.planName}
        </span>
      ) : null}
    </Button>
  );
}
