"use client";

import { VerdictBadge } from "@/components/marketplace/VerdictBadge";
import {
  COVERAGE_SUGGESTED_QUESTIONS,
  useCoverageAssistantChat,
} from "@/hooks/use-coverage-assistant-chat";
import { formatUsd } from "@/lib/coverage/tariff-snapshot";
import type { CoverageCitation, CoverageQaResult } from "@/lib/types/phase1";

interface CoverageAssistantProps {
  planVersionId: string;
  planName: string;
}

export function CoverageAssistant({
  planVersionId,
  planName,
}: CoverageAssistantProps) {
  const { messages, input, setInput, loading, askQuestion } =
    useCoverageAssistantChat(planVersionId);

  return (
    <section
      className="flex h-full min-h-0 flex-1 flex-col"
      aria-label="Conversación del asistente de cobertura"
    >
      <p className="shrink-0 border-b border-border px-4 py-2 text-xs text-muted-foreground">
        Preguntas sobre <strong className="text-foreground">{planName}</strong>.
        Responde con tarifas del catálogo y, cuando exista texto de póliza
        cargado, con citas reales — nunca inventa artículos ni cláusulas.
      </p>

      <div
        className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 py-3"
        aria-live="polite"
        aria-label="Historial de conversación"
      >
        {messages.length === 0 && (
          <p className="text-sm text-muted-foreground">
            Pregunta por precios (edad, género, región) o por coberturas cuando
            haya póliza disponible.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-4 rounded-xl bg-muted/60 p-3 text-sm"
                : "mr-4 rounded-xl border border-border bg-background p-3 text-sm"
            }
          >
            {msg.role === "user" && msg.question && (
              <p>
                <span className="font-semibold text-[var(--coveru-red)]">
                  Tú:{" "}
                </span>
                {msg.question}
              </p>
            )}
            {msg.error && (
              <p className="text-red-700" role="alert">
                {msg.error}
              </p>
            )}
            {msg.result && <AssistantAnswer result={msg.result} />}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-muted-foreground" aria-busy="true">
            Consultando catálogo y documentos…
          </p>
        )}
      </div>

      <div className="mt-auto shrink-0 border-t border-border bg-background">
        <SuggestedQuestions loading={loading} onSelect={askQuestion} />
        <Composer
          input={input}
          loading={loading}
          onInputChange={setInput}
          onSubmit={askQuestion}
        />
      </div>
    </section>
  );
}

function SuggestedQuestions({
  loading,
  onSelect,
}: {
  loading: boolean;
  onSelect: (question: string) => void;
}) {
  return (
    <div className="px-4 pt-3">
      <p className="text-xs font-medium text-muted-foreground">
        Preguntas sugeridas
      </p>
      <div className="mt-2 flex flex-wrap gap-2 pb-3">
        {COVERAGE_SUGGESTED_QUESTIONS.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => onSelect(q)}
            disabled={loading}
            className="rounded-full border border-border bg-background px-3 py-1 text-xs hover:border-[var(--coveru-red)] hover:text-[var(--coveru-red)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--coveru-red)]"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function Composer({
  input,
  loading,
  onInputChange,
  onSubmit,
}: {
  input: string;
  loading: boolean;
  onInputChange: (value: string) => void;
  onSubmit: (question: string) => void;
}) {
  return (
    <form
      className="flex gap-2 border-t border-border p-4"
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit(input);
      }}
    >
      <label htmlFor="coverage-question" className="sr-only">
        Tu pregunta sobre cobertura
      </label>
      <input
        id="coverage-question"
        type="text"
        value={input}
        onChange={(e) => onInputChange(e.target.value)}
        placeholder='Ej. "mujer 30 Sierra titular" o "¿cubre maternidad?"'
        disabled={loading}
        className="flex-1 rounded-full border border-border bg-background px-4 py-2 text-sm focus:border-[var(--coveru-red)] focus:outline-none focus:ring-2 focus:ring-[var(--coveru-red)]/20"
      />
      <button
        type="submit"
        disabled={loading || input.trim().length < 3}
        className="rounded-full bg-[var(--coveru-red)] px-5 py-2 text-sm font-semibold text-white hover:bg-[var(--coveru-red-dark)] disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--coveru-red)]"
      >
        Preguntar
      </button>
    </form>
  );
}

function AssistantAnswer({ result }: { result: CoverageQaResult }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-[var(--coveru-red)]">
          Asistente:
        </span>
        <VerdictBadge status={result.status} abstained={result.abstained} />
      </div>
      <p className="mt-2">{result.answer}</p>

      {result.matched_tariff && (
        <div className="mt-3 rounded-lg border border-sky-200 bg-sky-50 p-3 text-xs">
          <p className="font-semibold text-sky-900">Tarifa coincidente</p>
          <dl className="mt-2 grid gap-1 text-sky-900">
            <div>
              <dt className="inline font-medium">Prima mensual: </dt>
              <dd className="inline">
                {formatUsd(result.matched_tariff.monthly_price)}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Edad: </dt>
              <dd className="inline">
                {result.matched_tariff.age_min}–{result.matched_tariff.age_max}
              </dd>
            </div>
            <div>
              <dt className="inline font-medium">Región: </dt>
              <dd className="inline">{result.matched_tariff.region}</dd>
            </div>
            {result.matched_tariff.gender !== "any" && (
              <div>
                <dt className="inline font-medium">Género: </dt>
                <dd className="inline">{result.matched_tariff.gender}</dd>
              </div>
            )}
            {result.matched_tariff.grupo_asegurado && (
              <div>
                <dt className="inline font-medium">Grupo: </dt>
                <dd className="inline">{result.matched_tariff.grupo_asegurado}</dd>
              </div>
            )}
            {result.matched_tariff.maternidad && (
              <div>
                <dt className="inline font-medium">Maternidad: </dt>
                <dd className="inline">{result.matched_tariff.maternidad}</dd>
              </div>
            )}
            {result.matched_tariff.deductible != null && (
              <div>
                <dt className="inline font-medium">Deducible: </dt>
                <dd className="inline">
                  {formatUsd(result.matched_tariff.deductible)}
                </dd>
              </div>
            )}
          </dl>
        </div>
      )}

      {result.abstained && (
        <p
          className="mt-2 rounded-lg bg-muted p-2 text-xs text-muted-foreground"
          role="note"
        >
          No hay texto de póliza para esta pregunta. Puedes consultar precios con
          edad, género y región, o revisar el documento oficial con un asesor.
        </p>
      )}

      {result.policy_wording_controls && (
        <p className="mt-2 text-xs text-muted-foreground">
          La redacción oficial de la póliza prevalece sobre este resumen.
        </p>
      )}

      {result.citations.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Fuentes citadas
          </p>
          <ul className="mt-2 space-y-2">
            {result.citations.map((c: CoverageCitation, i: number) => (
              <li
                key={`${c.clause_ref}-${i}`}
                className="rounded-lg border border-border bg-muted/40 p-2 text-xs"
              >
                <p className="font-semibold">{c.clause_ref}</p>
                <p className="text-muted-foreground">{c.policy_document_title}</p>
                <p className="mt-1 italic">&ldquo;{c.excerpt}&rdquo;</p>
                {c.page_number != null && (
                  <p className="mt-1 text-muted-foreground">
                    Pág. {c.page_number}
                  </p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
