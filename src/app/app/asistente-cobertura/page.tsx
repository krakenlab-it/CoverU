import { Suspense } from "react";
import { CoverageAssistant } from "@/components/marketplace/CoverageAssistant";
import { PlanPickerSidebar } from "@/components/marketplace/PlanPickerSidebar";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { listInsurers, searchMarketplace } from "@/lib/marketplace/catalog";
import {
  parseMarketplaceFilters,
  toSearchParams,
} from "@/lib/marketplace/filters";

export const metadata = buildAppMetadata(
  "Asistente de cobertura",
  "Consulta precios y coberturas de planes publicados con respuestas fundamentadas en el catálogo CoverÜ.",
);

interface PageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function readParam(
  raw: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = raw[key];
  if (typeof value === "string") return value;
  if (Array.isArray(value) && value[0]) return value[0];
  return undefined;
}

export default async function CoverageAssistantPage({ searchParams }: PageProps) {
  const raw = await searchParams;
  const urlParams = toSearchParams(raw);
  const selectedPlanVersionId = readParam(raw, "plan_version_id");
  const filters = parseMarketplaceFilters(urlParams);

  const [insurers, marketplaceResults] = await Promise.all([
    listInsurers(),
    searchMarketplace(filters),
  ]);

  const selectedResult =
    selectedPlanVersionId != null
      ? marketplaceResults.find(
          (r) => r.planVersion.id === selectedPlanVersionId,
        )
      : marketplaceResults[0];

  return (
    <div className="space-y-6">
      <PageHeader
        breadcrumbs={
          <Breadcrumbs
            items={[
              { label: "Panel", href: "/app/marketplace" },
              { label: "Asistente de cobertura" },
            ]}
          />
        }
        title="Asistente de cobertura"
        description="Pregunta por tarifas (edad, género, región) y por coberturas cuando haya texto de póliza cargado."
      />

      {marketplaceResults.length === 0 ? (
        <EmptyState
          title="Sin planes publicados"
          description="Cuando haya planes con tarifas en el catálogo, podrás consultarlos aquí. Prueba ajustar los filtros si no ves resultados."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          <Suspense fallback={<Skeleton className="h-[32rem] rounded-2xl" />}>
            <PlanPickerSidebar
              key={urlParams.toString()}
              results={marketplaceResults}
              insurers={insurers}
              selectedPlanVersionId={selectedResult?.planVersion.id}
            />
          </Suspense>

          {selectedResult && (
            <CoverageAssistant
              planVersionId={selectedResult.planVersion.id}
              planName={selectedResult.plan.name}
            />
          )}
        </div>
      )}
    </div>
  );
}
