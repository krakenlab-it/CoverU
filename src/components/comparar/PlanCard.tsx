import { DemoBadge } from "@/components/platform/DemoBadge";
import { InsurerIdentity } from "@/components/insurers/InsurerIdentity";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getTariffRegionLabel } from "@/lib/catalog-enums";
import { resolveInsurerLogoUrl } from "@/lib/insurers/assets";
import { formatUsd } from "@/lib/marketplace/format";
import { motion } from "@/lib/motion";
import type { PublicQuoteOffer } from "@/lib/quoters/types";

interface PlanCardProps {
  offer: PublicQuoteOffer;
}

function formatAgeBand(offer: PublicQuoteOffer): string {
  if (offer.ageMin === offer.ageMax) return `${offer.ageMin} años`;
  return `${offer.ageMin}–${offer.ageMax} años`;
}

export function PlanCard({ offer }: PlanCardProps) {
  const logoUrl = resolveInsurerLogoUrl(
    { logo_url: offer.insurerLogoUrl, slug: offer.insurerSlug },
    { square: offer.insurerSlug === "bmi" },
  );

  return (
    <Card
      className={motion.cardHover}
      aria-labelledby={`offer-${offer.planId}-title`}
    >
      <CardHeader className="gap-2">
        <div className="flex items-start justify-between gap-2">
          <InsurerIdentity name={offer.insurerName} logoUrl={logoUrl} size="sm" />
          {offer.isDemo ? <DemoBadge /> : null}
        </div>
        <h3
          id={`offer-${offer.planId}-title`}
          className="font-heading text-base leading-snug font-medium sm:text-lg"
        >
          {offer.planName}
        </h3>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="rounded-xl bg-muted/60 p-4">
          <p className="text-xs text-muted-foreground">Prima mensual</p>
          <p className="text-2xl font-bold tracking-tight text-primary sm:text-3xl">
            {formatUsd(offer.monthlyPrice)}
            <span className="ml-1 text-sm font-normal text-muted-foreground">
              /mes
            </span>
          </p>
        </div>
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Deducible</dt>
            <dd className="font-medium">
              {offer.deductible != null ? formatUsd(offer.deductible) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Tope anual</dt>
            <dd className="font-medium">
              {offer.annualLimit != null ? formatUsd(offer.annualLimit) : "—"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Región tarifada</dt>
            <dd className="font-medium">{getTariffRegionLabel(offer.region)}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Franja de edad</dt>
            <dd className="font-medium">{formatAgeBand(offer)}</dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  );
}
