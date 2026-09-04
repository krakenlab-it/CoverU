"use client";

import { CoverageAssistant } from "@/components/marketplace/CoverageAssistant";
import { useCoverageAssistantPanel } from "@/components/coverage/coverage-assistant-context";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import {
  MessageSquareText,
  PanelRightClose,
  PanelRightOpen,
  X,
} from "lucide-react";
import Link from "next/link";
import { useIsMobile } from "@/hooks/use-media-query";

function RailHeader({ onClose }: { onClose: () => void }) {
  const { planContext } = useCoverageAssistantPanel();

  return (
    <div className="flex shrink-0 items-start justify-between gap-2 border-b border-border px-4 py-3">
      <div className="min-w-0">
        <h2 className="text-base font-semibold text-foreground">
          Asistente de cobertura
        </h2>
        {planContext ? (
          <p className="truncate text-xs text-muted-foreground">
            {planContext.planName}
          </p>
        ) : (
          <p className="text-xs text-muted-foreground">Sin plan seleccionado</p>
        )}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        onClick={onClose}
        aria-label="Cerrar asistente de cobertura"
      >
        <X className="size-4" aria-hidden="true" />
      </Button>
    </div>
  );
}

function AssistantPanelBody() {
  const { planContext } = useCoverageAssistantPanel();

  if (!planContext) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
        <MessageSquareText
          className="size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Consulta coberturas con IA
          </p>
          <p className="text-sm text-muted-foreground">
            Abre un plan en el marketplace para hacer preguntas fundamentadas en
            los documentos de la póliza.
          </p>
        </div>
        <Button asChild size="sm" variant="brand">
          <Link href="/app/marketplace">Ir al marketplace</Link>
        </Button>
      </div>
    );
  }

  return (
    <CoverageAssistant
      key={planContext.planVersionId}
      planVersionId={planContext.planVersionId}
      planName={planContext.planName}
      layout="panel"
    />
  );
}

function AssistantPanel({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <RailHeader onClose={onClose} />
      <AssistantPanelBody />
    </div>
  );
}

export function CoverageAssistantRail() {
  const { isOpen, open, close, toggle } = useCoverageAssistantPanel();
  const isMobile = useIsMobile();

  return (
    <>
      {!isOpen && isMobile ? (
        <Button
          type="button"
          variant="brand"
          size="sm"
          className="fixed bottom-5 right-4 z-40 gap-2 shadow-lg"
          onClick={open}
          aria-expanded={false}
          aria-controls="coverage-assistant-mobile-panel"
          aria-label="Abrir asistente de cobertura"
        >
          <MessageSquareText className="size-4" aria-hidden="true" />
          Asistente
        </Button>
      ) : null}

      {isMobile ? (
        <Sheet
          open={isOpen}
          onOpenChange={(next) => (next ? open() : close())}
        >
          <SheetContent
            id="coverage-assistant-mobile-panel"
            side="right"
            showCloseButton={false}
            className="w-full max-w-none p-0 sm:max-w-md"
          >
            <SheetHeader className="sr-only">
              <SheetTitle>Asistente de cobertura</SheetTitle>
            </SheetHeader>
            <AssistantPanel onClose={close} />
          </SheetContent>
        </Sheet>
      ) : null}

      {!isOpen && !isMobile ? (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="fixed right-0 top-1/2 z-30 hidden -translate-y-1/2 rounded-r-none border-r-0 pr-2 pl-3 shadow-sm md:inline-flex"
          onClick={open}
          aria-expanded={false}
          aria-controls="coverage-assistant-desktop-panel"
          aria-label="Abrir asistente de cobertura"
        >
          <PanelRightOpen className="size-4" aria-hidden="true" />
          <span className="sr-only">Asistente de cobertura</span>
        </Button>
      ) : null}

      {!isMobile ? (
      <aside
        id="coverage-assistant-desktop-panel"
        className={cn(
          "sticky top-0 h-screen shrink-0 flex-col border-l border-border bg-background flex",
          "transition-[width] duration-200 ease-in-out",
          isOpen ? "w-[min(33vw,28rem)]" : "w-0 overflow-hidden border-l-0",
        )}
        aria-label="Asistente de cobertura"
        aria-hidden={!isOpen}
      >
        {isOpen ? (
          <>
            <AssistantPanel onClose={close} />
            <div className="shrink-0 border-t border-border p-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="w-full justify-center"
                onClick={toggle}
                aria-expanded={isOpen}
                aria-controls="coverage-assistant-desktop-panel"
                aria-label="Contraer asistente de cobertura"
              >
                <PanelRightClose className="size-4" aria-hidden="true" />
                <span className="ms-1">Contraer</span>
              </Button>
            </div>
          </>
        ) : null}
      </aside>
      ) : null}
    </>
  );
}
