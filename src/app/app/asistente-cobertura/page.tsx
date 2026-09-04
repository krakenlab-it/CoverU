import Link from "next/link";
import { CoverageAssistant } from "@/components/marketplace/CoverageAssistant";
import { Breadcrumbs } from "@/components/platform/Breadcrumbs";
import { EmptyState } from "@/components/platform/EmptyState";
import { PageHeader } from "@/components/platform/PageHeader";
import { buildAppMetadata } from "@/lib/seo/metadata";
import { listPublishedPlanVersions, searchMarketplace } from "@/lib/marketplace/catalog";
import { parseMarketplaceFilters } from "@/lib/marketplace/filters";

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
  const selectedPlanVersionId = readParam(raw, "plan_version_id");
  const filters = parseMarketplaceFilters(new URLSearchParams());

  const [publishedVersions, marketplaceResults] = await Promise.all([
    listPublishedPlanVersions(),
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
          description="Cuando haya planes con tarifas en el catálogo, podrás consultarlos aquí."
        />
      ) : (
        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="rounded-2xl border border-coveru-border bg-white p-4">
            <h2 className="text-sm font-semibold">Plan activo</h2>
            <ul className="mt-3 space-y-2">
              {marketplaceResults.map((result) => {
                const active =
                  result.planVersion.id ===
                  (selectedResult?.planVersion.id ?? "");
                return (
                  <li key={result.planVersion.id}>
                    <Link
                      href={`/app/asistente-cobertura?plan_version_id=${result.planVersion.id}`}
                      className={`block rounded-lg px-3 py-2 text-sm ${
                        active
                          ? "bg-primary/10 font-medium text-primary"
                          : "text-muted-foreground hover:bg-muted"
                      }`}
                      aria-current={active ? "page" : undefined}
                    >
                      {result.plan.name}
                      <span className="mt-0.5 block text-xs text-coveru-gray">
                        {result.insurer.name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
            {publishedVersions.length > marketplaceResults.length && (
              <p className="mt-3 text-xs text-coveru-gray">
                Solo se listan planes publicados con tarifas coincidentes.
              </p>
            )}
          </aside>

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
