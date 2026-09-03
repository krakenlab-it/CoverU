import Link from "next/link";
import { notFound } from "next/navigation";
import { CoverageAssistant } from "@/components/marketplace/CoverageAssistant";
import { PlanDetailViewer } from "@/components/marketplace/PlanDetailViewer";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { getPlanVersionDetailForMarketplace } from "@/lib/marketplace/catalog";
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
  const detail = getPlanVersionDetailForMarketplace(planVersionId);
  return buildAppMetadata(
    detail?.plan?.name ?? "Detalle del plan",
    "Detalle de póliza y coberturas en el marketplace CoverÜ.",
  );
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

  const detail = getPlanVersionDetailForMarketplace(planVersionId);

  if (!detail?.plan || !detail.insurer || !detail.version) {
    notFound();
  }

  if (detail.version.status !== "published") {
    notFound();
  }

  return (
    <div className="space-y-6">
      <Breadcrumbs
        items={[
          { label: "Panel", href: "/app/marketplace" },
          { label: "Marketplace", href: `/app/marketplace${backQuery}` },
          { label: detail.plan.name },
        ]}
      />
      <Button variant="outline" size="sm" asChild>
        <Link href={`/app/marketplace${backQuery}`}>← Volver al marketplace</Link>
      </Button>

      <div className="grid gap-6 xl:grid-cols-[1fr_380px]">
        <PlanDetailViewer
          plan={detail.plan}
          insurer={detail.insurer}
          version={detail.version}
          coverageClauses={detail.coverage_clauses}
          exclusions={detail.exclusions}
          waitingPeriods={detail.waiting_periods}
          policyDocuments={detail.policy_documents}
          citations={detail.citations}
        />
        <aside className="xl:sticky xl:top-24 xl:self-start">
          <CoverageAssistant
            planVersionId={planVersionId}
            planName={detail.plan.name}
          />
        </aside>
      </div>
    </div>
  );
}
