import { getCategoryLabel } from "@/lib/marketplace/catalog";
import { formatCatalogDisplayName } from "@/lib/marketplace/display";
import { formatDate } from "@/lib/marketplace/format";
import { WAITING_PERIOD_LABELS } from "@/lib/marketplace/categories";
import { EmptyState } from "@/components/platform/EmptyState";
import { VerdictBadge } from "@/components/marketplace/VerdictBadge";
import type {
  Citation,
  CoverageClause,
  Exclusion,
  PlanVersion,
  PolicyDocument,
  WaitingPeriod,
} from "@/lib/types/phase1";
import type { Insurer, Plan } from "@/lib/types/database";

interface PlanDetailViewerProps {
  plan: Plan;
  insurer: Insurer;
  version: PlanVersion;
  coverageClauses: CoverageClause[];
  exclusions: Exclusion[];
  waitingPeriods: WaitingPeriod[];
  policyDocuments: PolicyDocument[];
  citations: Citation[];
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
}: PlanDetailViewerProps) {
  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-coveru-border bg-white p-6">
        <p className="text-sm text-coveru-gray">
          {formatCatalogDisplayName(insurer.name)}
        </p>
        <h1 className="text-2xl font-bold">
          {formatCatalogDisplayName(plan.name)}
        </h1>
        {plan.description && (
          <p className="mt-2 text-coveru-gray">{plan.description}</p>
        )}
        <div className="mt-4 flex flex-wrap gap-2">
          <span className="rounded-full bg-coveru-light px-3 py-1 text-xs font-semibold">
            {version.label ?? `Versión ${version.version_number}`}
          </span>
          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
            {version.status === "published" ? "Publicada" : version.status}
          </span>
        </div>
        <p className="mt-3 text-sm text-coveru-gray">
          Vigente desde {formatDate(version.effective_from)}
          {version.effective_to
            ? ` hasta ${formatDate(version.effective_to)}`
            : ""}
        </p>
      </header>

      <section
        aria-labelledby="policy-controls-heading"
        className="rounded-2xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900"
      >
        <h2 id="policy-controls-heading" className="font-semibold">
          La redacción de la póliza controla
        </h2>
        <p className="mt-1">
          Este resumen es orientativo. En caso de discrepancia, prevalecen las
          condiciones generales y particulares del documento de póliza vigente.
        </p>
      </section>

      {coverageClauses.length === 0 &&
      exclusions.length === 0 &&
      waitingPeriods.length === 0 &&
      policyDocuments.length === 0 ? (
        <EmptyState
          title="Detalle de cobertura no disponible"
          description="Este plan aún no tiene cláusulas, exclusiones ni documentos de póliza cargados en el catálogo."
        />
      ) : null}

      {coverageClauses.length > 0 ? (
        <section
          aria-labelledby="benefits-heading"
          className="rounded-2xl border border-coveru-border bg-white p-6"
        >
          <h2 id="benefits-heading" className="text-lg font-semibold">
            Coberturas y beneficios
          </h2>
          <ul className="mt-4 space-y-4">
            {coverageClauses.map((clause) => (
              <li
                key={clause.id}
                className="rounded-xl border border-coveru-border p-4"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-semibold">{clause.title}</h3>
                  <VerdictBadge status={clause.coverage_status} />
                  <span className="text-xs text-coveru-gray">
                    {getCategoryLabel(clause.category)}
                  </span>
                </div>
                {clause.description && (
                  <p className="mt-2 text-sm text-coveru-gray">
                    {clause.description}
                  </p>
                )}
                {clause.conditions && (
                  <p className="mt-2 text-sm">
                    <span className="font-medium">Condiciones:</span>{" "}
                    {clause.conditions}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {exclusions.length > 0 && (
        <section
          aria-labelledby="exclusions-heading"
          className="rounded-2xl border border-coveru-border bg-white p-6"
        >
          <h2 id="exclusions-heading" className="text-lg font-semibold">
            Exclusiones
          </h2>
          <ul className="mt-4 space-y-3">
            {exclusions.map((ex) => (
              <li key={ex.id} className="text-sm">
                <p className="font-medium">{ex.title}</p>
                {ex.description && (
                  <p className="text-coveru-gray">{ex.description}</p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {waitingPeriods.length > 0 && (
        <section
          aria-labelledby="waiting-heading"
          className="rounded-2xl border border-coveru-border bg-white p-6"
        >
          <h2 id="waiting-heading" className="text-lg font-semibold">
            Períodos de carencia
          </h2>
          <ul className="mt-4 space-y-2 text-sm">
            {waitingPeriods.map((w) => (
              <li key={w.id}>
                <span className="font-medium">
                  {WAITING_PERIOD_LABELS[w.service_category] ??
                    w.service_category}
                </span>
                : {w.days} días
                {w.notes && (
                  <span className="text-coveru-gray"> — {w.notes}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {policyDocuments.length > 0 ? (
        <section
          aria-labelledby="documents-heading"
          className="rounded-2xl border border-coveru-border bg-white p-6"
        >
          <h2 id="documents-heading" className="text-lg font-semibold">
            Documentos fuente
          </h2>
          <ul className="mt-4 space-y-4">
            {policyDocuments.map((doc) => (
              <li key={doc.id} className="rounded-xl bg-coveru-light p-4">
                <p className="font-medium">{doc.title}</p>
                <p className="text-xs text-coveru-gray">
                  Tipo: {doc.document_type.replace(/_/g, " ")}
                </p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed">
                  {doc.content}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {citations.length > 0 && (
        <section
          aria-labelledby="citations-heading"
          className="rounded-2xl border border-coveru-border bg-white p-6"
        >
          <h2 id="citations-heading" className="text-lg font-semibold">
            Citas y referencias
          </h2>
          <ul className="mt-4 space-y-3">
            {citations.map((c) => (
              <li
                key={c.id}
                className="border-l-4 border-coveru-red pl-4 text-sm"
              >
                <p className="font-semibold">{c.clause_ref}</p>
                <p className="mt-1 italic text-coveru-gray">
                  &ldquo;{c.excerpt}&rdquo;
                </p>
                {c.page_number != null && (
                  <p className="mt-1 text-xs text-coveru-gray">
                    Página {c.page_number}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
