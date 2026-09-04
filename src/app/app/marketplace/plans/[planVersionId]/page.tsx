import { Suspense } from "react";
import { notFound } from "next/navigation";
import { PlanCoverageAssistantBridge } from "@/components/marketplace/PlanCoverageAssistantBridge";
import { PlanCoverageAssistantPrompt } from "@/components/marketplace/PlanCoverageAssistantPrompt";
import { PlanDetailActions } from "@/components/marketplace/PlanDetailActions";
import { PlanDetailViewer } from "@/components/marketplace/PlanDetailViewer";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { LoadingState } from "@/components/platform/LoadingState";
import { buildAppMetadata } from "@/lib/seo/metadata";
import {
  getPlanTariffQuote,
  getPlanVersionDetailForMarketplace,
} from "@/lib/marketplace/catalog";
import {
  filtersToQueryString,
  parseMarketplaceFilters,
} from "@/lib/marketplace/filters";

interface PageProps {
  params: Promise<{ planVersionId: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function toSearchParams(
  raw: Record<string, string | string[] | undefined>,
): URLSearchParams {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    if (typeof value === "string") params.set(key, value);
    else if (Array.isArray(value) && value[0]) params.set(key, value[0]);
  }
  return params;
}

export async function generateMetadata({ params }: PageProps) {
  const { planVersionId } = await params;
  const detail = await getPlanVersionDetailForMarketplace(planVersionId);
  return buildAppMetadata(
    detail?.plan?.name ?? "Detalle del plan",
    "Detalle de póliza y coberturas en el marketplace CoverÜ.",
  );
}

function ActionsSkeleton() {
  return <LoadingState label="Cargando acciones" />;
}

export default async function PlanDetailPage({
  params,
  searchParams,
}: PageProps) {
  const { planVersionId } = await params;
  const raw = await searchParams;
  const urlParams = toSearchParams(raw);
  const filters = parseMarketplaceFilters(urlParams);
  const compareParam = urlParams.get("compare");
  const backQuery = filtersToQueryString(
    filters,
    compareParam ? compareParam.split(",") : undefined,
  );

  const detail = await getPlanVersionDetailForMarketplace(planVersionId);

  if (!detail?.plan || !detail.insurer || !detail.version) {
    notFound();
  }

  if (detail.version.status !== "published") {
    notFound();
  }

  const quote = await getPlanTariffQuote(detail.plan.id, filters);

  return (
    <div className="space-y-6">
      <PlanCoverageAssistantBridge
        planVersionId={planVersionId}
        planName={detail.plan.name}
      />
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/app" },
          { label: "Marketplace", href: `/app/marketplace${backQuery}` },
          { label: detail.plan.name },
        ]}
      />

      <Suspense fallback={<ActionsSkeleton />}>
        <PlanDetailActions
          planVersionId={planVersionId}
          filters={filters}
          backQuery={backQuery}
        />
      </Suspense>

      <PlanCoverageAssistantPrompt planName={detail.plan.name} />

      <PlanDetailViewer
        plan={detail.plan}
        insurer={detail.insurer}
        version={detail.version}
        coverageClauses={detail.coverage_clauses}
        exclusions={detail.exclusions}
        waitingPeriods={detail.waiting_periods}
        policyDocuments={detail.policy_documents}
        citations={detail.citations}
        tariff={quote.tariff}
        quoteState={quote.quoteState}
        monthlyPrice={quote.monthlyPrice}
        tariffCount={quote.tariffCount}
        filters={filters}
      />
    </div>
  );
}
