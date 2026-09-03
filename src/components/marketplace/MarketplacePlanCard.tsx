"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import type { QuoteState } from "@/lib/marketplace/types";
import { formatCLP } from "@/lib/marketplace/format";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const QUOTE_LABELS: Record<QuoteState, string> = {
  quoted: "Cotización",
  indicative: "Precio indicativo",
  unavailable: "Sin tarifa para este perfil",
};

interface MarketplacePlanCardProps {
  planVersionId: string;
  planName: string;
  insurerName: string;
  monthlyPrice: number | null;
  quoteState: QuoteState;
  coverageHighlights: string[];
  exclusionWarnings: string[];
  waitingPeriodWarnings: string[];
  isSelectedForCompare: boolean;
  compareDisabledReason?: string;
  detailHref: string;
  onToggleCompare: () => void;
}

export function MarketplacePlanCard({
  planVersionId,
  planName,
  insurerName,
  monthlyPrice,
  quoteState,
  coverageHighlights,
  exclusionWarnings,
  waitingPeriodWarnings,
  isSelectedForCompare,
  compareDisabledReason,
  detailHref,
  onToggleCompare,
}: MarketplacePlanCardProps) {
  const compareDisabled = Boolean(compareDisabledReason) && !isSelectedForCompare;

  return (
    <Card
      className={cn(
        motion.cardHover,
        motion.panel,
        isSelectedForCompare && "ring-2 ring-primary ring-offset-2",
      )}
      aria-labelledby={`plan-${planVersionId}-title`}
    >
      <CardHeader className="flex-row items-start justify-between gap-2 space-y-0">
        <div>
          <p className="text-sm text-muted-foreground">{insurerName}</p>
          <CardTitle id={`plan-${planVersionId}-title`} className="text-lg">
            {planName}
          </CardTitle>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {QUOTE_LABELS[quoteState]}
          </p>
          {monthlyPrice != null ? (
            <p className="text-2xl font-bold text-primary">
              {formatCLP(monthlyPrice)}
              <span className="text-sm font-normal text-muted-foreground">/mes</span>
            </p>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ajusta edad, género o provincia para ver una tarifa.
            </p>
          )}
        </div>

        {coverageHighlights.length > 0 ? (
          <ul className="space-y-1 text-sm" aria-label="Coberturas destacadas">
            {coverageHighlights.map((item) => (
              <li key={item} className="flex items-start gap-2">
                <span className="text-emerald-600" aria-hidden="true">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>
        ) : null}

        {exclusionWarnings.length > 0 ? (
          <div
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
            role="note"
          >
            <p className="font-semibold">Exclusiones a considerar</p>
            <ul className="mt-1 list-inside list-disc">
              {exclusionWarnings.slice(0, 2).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {waitingPeriodWarnings.length > 0 ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"
            role="note"
          >
            <p className="font-semibold">Períodos de carencia</p>
            <ul className="mt-1 list-inside list-disc">
              {waitingPeriodWarnings.slice(0, 2).map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="flex flex-wrap gap-2">
        <Button variant="outline" asChild className="flex-1 rounded-full">
          <Link href={detailHref}>Ver póliza</Link>
        </Button>
        <Button
          type="button"
          variant={isSelectedForCompare ? "secondary" : "brand"}
          className="flex-1 rounded-full"
          onClick={onToggleCompare}
          disabled={compareDisabled}
          aria-pressed={isSelectedForCompare}
          aria-label={
            isSelectedForCompare
              ? `Quitar ${planName} de la comparación`
              : `Agregar ${planName} a la comparación`
          }
          title={compareDisabled ? compareDisabledReason : undefined}
        >
          {isSelectedForCompare ? "En comparación" : "Comparar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
