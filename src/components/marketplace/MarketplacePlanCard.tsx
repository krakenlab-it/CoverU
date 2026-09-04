"use client";

import {
  AlertTriangleIcon,
  CheckCircle2Icon,
  Clock3Icon,
  ExternalLinkIcon,
  GitCompareArrowsIcon,
} from "lucide-react";
import Link from "next/link";
import { InsurerIdentity } from "@/components/insurers/InsurerIdentity";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card";
import { formatCatalogDisplayName } from "@/lib/marketplace/display";
import type { QuoteState } from "@/lib/marketplace/types";
import { formatCLP } from "@/lib/marketplace/format";
import { motion } from "@/lib/motion";
import { cn } from "@/lib/utils";

const QUOTE_LABELS: Record<QuoteState, string> = {
  quoted: "Cotización",
  indicative: "Precio indicativo",
  unavailable: "Sin tarifa para este perfil",
};

const QUOTE_VARIANTS: Record<
  QuoteState,
  "default" | "secondary" | "outline"
> = {
  quoted: "default",
  indicative: "secondary",
  unavailable: "outline",
};

interface MarketplacePlanCardProps {
  planVersionId: string;
  planName: string;
  insurerName: string;
  insurerLogoUrl?: string | null;
  monthlyPrice: number | null;
  quoteState: QuoteState;
  deductible?: number | null;
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
  insurerLogoUrl,
  monthlyPrice,
  quoteState,
  deductible,
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
        "flex h-full flex-col overflow-hidden border-border/80",
        isSelectedForCompare && "border-primary ring-2 ring-primary/20",
      )}
      aria-labelledby={`plan-${planVersionId}-title`}
    >
      <CardHeader className="space-y-3 border-b border-border/50 bg-muted/20 pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1">
            <InsurerIdentity
              name={insurerName}
              logoUrl={insurerLogoUrl}
              size="sm"
            />
            <h3
              id={`plan-${planVersionId}-title`}
              className="text-lg font-semibold leading-tight text-foreground"
            >
              {formatCatalogDisplayName(planName)}
            </h3>
          </div>
          <Badge variant={QUOTE_VARIANTS[quoteState]} className="shrink-0">
            {QUOTE_LABELS[quoteState]}
          </Badge>
        </div>

        <div className="rounded-xl border border-border/60 bg-background p-4">
          {monthlyPrice != null ? (
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Prima mensual estimada</p>
              <p className="text-3xl font-bold tracking-tight text-primary">
                {formatCLP(monthlyPrice)}
                <span className="ml-1 text-sm font-normal text-muted-foreground">/mes</span>
              </p>
              {deductible != null ? (
                <p className="text-xs text-muted-foreground">
                  Deducible: {formatCLP(deductible)}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              Ajusta edad, género o región para ver una tarifa.
            </p>
          )}
        </div>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4 py-4">
        {coverageHighlights.length > 0 ? (
          <ul className="space-y-2 text-sm" aria-label="Coberturas destacadas">
            {coverageHighlights.map((item) => (
              <li key={item} className="flex items-start gap-2 text-foreground/90">
                <CheckCircle2Icon
                  className="mt-0.5 size-4 shrink-0 text-emerald-600"
                  aria-hidden="true"
                />
                <span>{item}</span>
              </li>
            ))}
          </ul>
        ) : null}

        {exclusionWarnings.length > 0 ? (
          <div
            className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-xs text-destructive"
            role="note"
          >
            <p className="flex items-center gap-1.5 font-semibold">
              <AlertTriangleIcon className="size-3.5" aria-hidden="true" />
              Exclusiones a considerar
            </p>
            <ul className="mt-1.5 space-y-1 pl-5">
              {exclusionWarnings.slice(0, 2).map((w) => (
                <li key={w} className="list-disc">{w}</li>
              ))}
            </ul>
          </div>
        ) : null}

        {waitingPeriodWarnings.length > 0 ? (
          <div
            className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950"
            role="note"
          >
            <p className="flex items-center gap-1.5 font-semibold">
              <Clock3Icon className="size-3.5" aria-hidden="true" />
              Períodos de carencia
            </p>
            <ul className="mt-1.5 space-y-1 pl-5">
              {waitingPeriodWarnings.slice(0, 2).map((w) => (
                <li key={w} className="list-disc">{w}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </CardContent>

      <CardFooter className="mt-auto flex flex-wrap gap-2 border-t border-border/50 bg-muted/10 py-4">
        <Button variant="outline" asChild className="flex-1 rounded-full">
          <Link href={detailHref}>
            <ExternalLinkIcon aria-hidden="true" />
            Ver póliza
          </Link>
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
          <GitCompareArrowsIcon aria-hidden="true" />
          {isSelectedForCompare ? "En comparación" : "Comparar"}
        </Button>
      </CardFooter>
    </Card>
  );
}
