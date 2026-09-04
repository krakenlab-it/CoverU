import { getCategoryLabel } from "@/lib/marketplace/catalog";
import { formatCatalogDisplayName } from "@/lib/marketplace/display";
import { formatDate } from "@/lib/marketplace/format";
import { WAITING_PERIOD_LABELS } from "@/lib/marketplace/categories";
import {
  GRUPO_ASEGURADO_OPTIONS,
  getTariffRegionLabel,
} from "@/lib/catalog-enums";
import { formatUsd } from "@/lib/coverage/tariff-snapshot";
import { InsurerIdentity } from "@/components/insurers/InsurerIdentity";
import { VerdictBadge } from "@/components/marketplace/VerdictBadge";
import type { MarketplaceFilters, QuoteState } from "@/lib/marketplace/types";
import type { Tariff } from "@/lib/types/database";
import type {
  Citation,
  CoverageClause,
  Exclusion,
  PlanVersion,
  PolicyDocument,
  WaitingPeriod,
} from "@/lib/types/phase1";
import type { Insurer, Plan } from "@/lib/types/database";
import { cn } from "@/lib/utils";

const QUOTE_LABELS: Record<QuoteState, string> = {
  quoted: "Prima mensual",
  indicative: "Precio indicativo",
  unavailable: "Sin tarifa para este perfil",
};

function grupoLabel(value: string | null | undefined): string | null {
  if (!value) return null;
  return (
    GRUPO_ASEGURADO_OPTIONS.find((g) => g.value === value)?.label ?? value
  );
}

function SectionShell({
  id,
  title,
  description,
  children,
  className,
}: {
  id: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      aria-labelledby={id}
      className={cn(
        "overflow-hidden rounded-2xl border border-coveru-border bg-white",
        className,
      )}
    >
      <div className="border-b border-coveru-border px-6 py-4">
        <h2 id={id} className="text-sm font-semibold tracking-tight text-foreground">
          {title}
        </h2>
        {description ? (
          <p className="mt-1 text-sm text-coveru-gray">{description}</p>
        ) : null}
      </div>
      <div className="px-6 py-5">{children}</div>
    </section>
  );
}

function SectionEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      role="status"
      className="rounded-xl border border-dashed border-coveru-border bg-coveru-light px-5 py-6"
    >
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm leading-relaxed text-coveru-gray">
        {description}
      </p>
    </div>
  );
}

interface PlanDetailViewerProps {
  plan: Plan;
  insurer: Insurer;
  version: PlanVersion;
  coverageClauses: CoverageClause[];
  exclusions: Exclusion[];
  waitingPeriods: WaitingPeriod[];
  policyDocuments: PolicyDocument[];
  citations: Citation[];
  tariff: Tariff | null;
  quoteState: QuoteState;
  monthlyPrice: number | null;
  tariffCount: number;
  filters: MarketplaceFilters;
}

export function PlanDetailViewer({
  plan,
  insurer,
  version,
  coverageClauses,
  exclusions,
  waitingPeriods,
  policyDocuments,
  citations,
  tariff,
  quoteState,
  monthlyPrice,
  tariffCount,
  filters,
}: PlanDetailViewerProps) {
  const hasCoverageData =
    coverageClauses.length > 0 ||
    exclusions.length > 0 ||
    waitingPeriods.length > 0 ||
    policyDocuments.length > 0 ||
    citations.length > 0;

  const regionLabel = tariff?.region
    ? getTariffRegionLabel(String(tariff.region))
    : filters.region
      ? getTariffRegionLabel(filters.region)
      : null;
  const grupo = grupoLabel(tariff?.grupo_asegurado);

  return (
    <div className="space-y-6">
      <header
        className="overflow-hidden rounded-3xl border border-coveru-border bg-white shadow-[0_8px_28px_rgb(23_23_26/8%)]"
      >
        <div className="h-1 bg-coveru-red" aria-hidden="true" />
        <div className="px-6 py-8 sm:px-8">
          <InsurerIdentity
            name={insurer.name}
            logoUrl={insurer.logo_url}
            size="md"
            nameClassName="text-coveru-gray"
          />
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            {formatCatalogDisplayName(plan.name)}
          </h1>
          {plan.description ? (
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-coveru-gray">
              {plan.description}
            </p>
          ) : null}

          <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-coveru-border bg-coveru-light px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-coveru-gray">
                Versión
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                {version.label ?? `v${version.version_number}`}
                <span className="ml-2 inline-flex rounded-full bg-red-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-coveru-red">
                  Publicada
                </span>
              </dd>
            </div>
            {regionLabel ? (
              <div className="rounded-xl border border-coveru-border bg-coveru-light px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-coveru-gray">
                  Región
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {regionLabel}
                </dd>
              </div>
            ) : null}
            {grupo ? (
              <div className="rounded-xl border border-coveru-border bg-coveru-light px-4 py-3">
                <dt className="text-xs font-medium uppercase tracking-wide text-coveru-gray">
                  Grupo asegurado
                </dt>
                <dd className="mt-1 text-sm font-medium text-foreground">
                  {grupo}
                </dd>
              </div>
            ) : null}
            <div className="rounded-xl border border-coveru-border bg-coveru-light px-4 py-3">
              <dt className="text-xs font-medium uppercase tracking-wide text-coveru-gray">
                Vigencia
              </dt>
              <dd className="mt-1 text-sm font-medium text-foreground">
                Desde {formatDate(version.effective_from)}
                {version.effective_to
                  ? ` · hasta ${formatDate(version.effective_to)}`
                  : ""}
              </dd>
            </div>
          </dl>

          {tariffCount > 0 ? (
            <div className="mt-6 rounded-2xl border border-coveru-border bg-coveru-light p-5">
              <p className="text-xs font-semibold uppercase tracking-[0.12em] text-coveru-gray">
                {QUOTE_LABELS[quoteState]}
              </p>
              {monthlyPrice != null ? (
                <p className="mt-1 text-3xl font-semibold tracking-tight text-coveru-red">
                  {formatUsd(monthlyPrice)}
                  <span className="ml-1 text-sm font-normal text-coveru-gray">
                    /mes
                  </span>
                </p>
              ) : (
                <p className="mt-2 text-sm leading-relaxed text-coveru-gray">
                  Hay {tariffCount} fila{tariffCount !== 1 ? "s" : ""} tarifaria
                  {tariffCount !== 1 ? "s" : ""} en el catálogo. Ajusta edad,
                  género o región en el marketplace para ver una prima aplicable
                  a tu perfil.
                </p>
              )}
              {tariff && (
                <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-1 text-xs text-coveru-gray">
                  <li>
                    Edad {tariff.age_min}–{tariff.age_max}
                  </li>
                  {tariff.gender !== "any" && <li>Género {tariff.gender}</li>}
                  {tariff.deductible != null && (
                    <li>Deducible {formatUsd(tariff.deductible)}</li>
                  )}
                  {tariff.maternidad && (
                    <li>Maternidad {tariff.maternidad}</li>
                  )}
                </ul>
              )}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-coveru-border bg-coveru-light px-5 py-4">
              <p className="text-sm font-medium text-foreground">
                Sin tarifario cargado
              </p>
              <p className="mt-1 text-sm text-coveru-gray">
                Este plan no tiene filas de tarifa en el catálogo. No mostramos
                precios hasta que existan datos verificados.
              </p>
            </div>
          )}
        </div>
      </header>

      <aside
        className="border-l-4 border-coveru-red bg-coveru-light px-5 py-4 text-sm leading-relaxed text-foreground"
        aria-label="Aviso legal"
      >
        <p className="font-medium">La redacción de la póliza controla</p>
        <p className="mt-1 text-coveru-gray">
          Este resumen es orientativo. En caso de discrepancia, prevalecen las
          condiciones generales y particulares del documento de póliza vigente.
        </p>
      </aside>

      {!hasCoverageData ? (
        <SectionEmpty
          title="Detalle de cobertura no disponible"
          description="Este plan aún no tiene cláusulas, exclusiones ni documentos de póliza cargados en el catálogo. Cuando se importen, aparecerán aquí con citas verificables."
        />
      ) : null}

      {coverageClauses.length > 0 ? (
        <SectionShell
          id="benefits-heading"
          title="Coberturas y beneficios"
          description="Resumen estructurado de las cláusulas publicadas para esta versión."
        >
          <ul className="divide-y divide-coveru-border">
            {coverageClauses.map((clause) => (
              <li key={clause.id} className="py-4 first:pt-0 last:pb-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-sm font-semibold text-foreground">
                    {clause.title}
                  </h3>
                  <VerdictBadge status={clause.coverage_status} />
                  <span className="text-xs text-coveru-gray">
                    {getCategoryLabel(clause.category)}
                  </span>
                </div>
                {clause.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-coveru-gray">
                    {clause.description}
                  </p>
                ) : null}
                {clause.conditions ? (
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-medium">Condiciones:</span>{" "}
                    {clause.conditions}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : hasCoverageData ? (
        <SectionShell id="benefits-heading" title="Coberturas y beneficios">
          <SectionEmpty
            title="Sin cláusulas publicadas"
            description="No hay coberturas estructuradas para esta versión del plan."
          />
        </SectionShell>
      ) : null}

      {exclusions.length > 0 ? (
        <SectionShell
          id="exclusions-heading"
          title="Exclusiones"
          description="Limitaciones explícitas registradas en el catálogo."
        >
          <ul className="space-y-4">
            {exclusions.map((ex) => (
              <li key={ex.id}>
                <p className="text-sm font-medium text-foreground">
                  {ex.title}
                </p>
                {ex.description ? (
                  <p className="mt-1 text-sm leading-relaxed text-coveru-gray">
                    {ex.description}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {waitingPeriods.length > 0 ? (
        <SectionShell
          id="waiting-heading"
          title="Períodos de carencia"
          description="Plazos antes de que apliquen determinados beneficios."
        >
          <ul className="divide-y divide-coveru-border text-sm">
            {waitingPeriods.map((w) => (
              <li
                key={w.id}
                className="flex flex-wrap items-baseline justify-between gap-2 py-3 first:pt-0 last:pb-0"
              >
                <span className="font-medium text-foreground">
                  {WAITING_PERIOD_LABELS[w.service_category] ??
                    w.service_category}
                </span>
                <span className="text-coveru-gray">
                  {w.days} días
                  {w.notes ? ` · ${w.notes}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {policyDocuments.length > 0 ? (
        <SectionShell
          id="documents-heading"
          title="Documentos fuente"
          description="Texto de referencia importado desde condiciones de póliza."
        >
          <ul className="space-y-4">
            {policyDocuments.map((doc) => (
              <li
                key={doc.id}
                className="rounded-xl border border-coveru-border bg-coveru-light p-4"
              >
                <p className="text-sm font-medium text-foreground">
                  {doc.title}
                </p>
                <p className="mt-1 text-xs uppercase tracking-wide text-coveru-gray">
                  {doc.document_type.replace(/_/g, " ")}
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-foreground">
                  {doc.content}
                </p>
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}

      {citations.length > 0 ? (
        <SectionShell
          id="citations-heading"
          title="Citas y referencias"
          description="Extractos vinculados a documentos de póliza."
        >
          <ul className="space-y-4">
            {citations.map((c) => (
              <li
                key={c.id}
                className="border-l-2 border-coveru-red pl-4"
              >
                <p className="text-sm font-semibold text-foreground">
                  {c.clause_ref}
                </p>
                <p className="mt-1 text-sm italic leading-relaxed text-coveru-gray">
                  &ldquo;{c.excerpt}&rdquo;
                </p>
                {c.page_number != null ? (
                  <p className="mt-1 text-xs text-coveru-gray">
                    Página {c.page_number}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </SectionShell>
      ) : null}
    </div>
  );
}
