"use client";

import { useCallback, useState } from "react";
import { VerdictBadge } from "@/components/marketplace/VerdictBadge";
import type { CoverageCitation, CoverageQaResult } from "@/lib/types/phase1";
import { formatUsd } from "@/lib/coverage/tariff-snapshot";

const SUGGESTED_QUESTIONS = [
  "hombre 35 Costa titular",
  "¿Cuál es el precio mensual?",
  "¿Incluye maternidad?",
  "comparar edad 25 y 45",
  "¿Está cubierta la hospitalización?",
];

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  question?: string;
  result?: CoverageQaResult;
  error?: string;
}

interface CoverageAssistantProps {
  planVersionId: string;
  planName: string;
}

export function CoverageAssistant({
  planVersionId,
  planName,
}: CoverageAssistantProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed.length < 3 || loading) return;

      const userMsg: ChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        question: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const res = await fetch("/api/app/coverage/qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_version_id: planVersionId,
            question: trimmed,
          }),
        });

        const json = (await res.json()) as {
          data?: CoverageQaResult;
          error?: { message: string };
        };

        if (!res.ok || !json.data) {
          setMessages((prev) => [
            ...prev,
            {
              id: `e-${Date.now()}`,
              role: "assistant",
              error:
                json.error?.message ??
                "No se pudo obtener una respuesta fundamentada.",
            },
          ]);
          return;
        }

        setMessages((prev) => [
          ...prev,
          {
            id: `a-${Date.now()}`,
            role: "assistant",
            result: json.data,
          },
        ]);
      } catch {
        setMessages((prev) => [
          ...prev,
          {
            id: `e-${Date.now()}`,
            role: "assistant",
            error: "Error de conexión. Intenta de nuevo.",
          },
        ]);
      } finally {
        setLoading(false);
      }
    },
    [loading, planVersionId],
  );

  return (
    <section
      aria-labelledby="assistant-heading"
      className="rounded-2xl border border-coveru-border bg-white p-6"
    >
      <h2 id="assistant-heading" className="text-lg font-semibold">
        Asistente de cobertura
      </h2>
      <p className="mt-1 text-sm text-coveru-gray">
        Preguntas sobre <strong>{planName}</strong>. Responde con tarifas del
        catálogo y, cuando exista texto de póliza cargado, con citas reales —
        nunca inventa artículos ni cláusulas.
      </p>

      <div
        className="mt-4 max-h-96 space-y-4 overflow-y-auto rounded-xl bg-coveru-light p-4"
        aria-live="polite"
        aria-label="Historial de conversación"
      >
        {messages.length === 0 && (
          <p className="text-sm text-coveru-gray">
            Pregunta por precios (edad, género, región) o por coberturas cuando
            haya póliza disponible.
          </p>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={
              msg.role === "user"
                ? "ml-8 rounded-xl bg-white p-3 text-sm shadow-sm"
                : "mr-8 rounded-xl border border-coveru-border bg-white p-3 text-sm"
            }
          >
            {msg.role === "user" && msg.question && (
              <p>
                <span className="font-semibold text-coveru-red">Tú: </span>
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
          <p className="text-sm text-coveru-gray" aria-busy="true">
            Consultando catálogo y documentos…
          </p>
        )}
      </div>

      <div className="mt-4">
        <p className="text-xs font-medium text-coveru-gray">
          Preguntas sugeridas
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {SUGGESTED_QUESTIONS.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => askQuestion(q)}
              disabled={loading}
              className="rounded-full border border-coveru-border bg-white px-3 py-1 text-xs hover:border-coveru-red hover:text-coveru-red disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      <form
        className="mt-4 flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          askQuestion(input);
        }}
      >
        <label htmlFor="coverage-question" className="sr-only">
          Tu pregunta sobre cobertura
        </label>
        <input
          id="coverage-question"
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder='Ej. "mujer 30 Sierra titular" o "¿cubre maternidad?"'
          disabled={loading}
          className="flex-1 rounded-full border border-coveru-border px-4 py-2 text-sm focus:border-coveru-red focus:outline-none focus:ring-2 focus:ring-coveru-red/20"
        />
        <button
          type="submit"
          disabled={loading || input.trim().length < 3}
          className="rounded-full bg-coveru-red px-5 py-2 text-sm font-semibold text-white hover:bg-coveru-red-dark disabled:opacity-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-coveru-red"
        >
          Preguntar
        </button>
      </form>
    </section>
  );
}

function AssistantAnswer({ result }: { result: CoverageQaResult }) {
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-semibold text-coveru-red">Asistente:</span>
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
          className="mt-2 rounded-lg bg-gray-100 p-2 text-xs text-gray-700"
          role="note"
        >
          No hay texto de póliza para esta pregunta. Puedes consultar precios con
          edad, género y región, o revisar el documento oficial con un asesor.
        </p>
      )}

      {result.policy_wording_controls && (
        <p className="mt-2 text-xs text-coveru-gray">
          La redacción oficial de la póliza prevalece sobre este resumen.
        </p>
      )}

      {result.citations.length > 0 && (
        <div className="mt-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-coveru-gray">
            Fuentes citadas
          </p>
          <ul className="mt-2 space-y-2">
            {result.citations.map((c: CoverageCitation, i: number) => (
              <li
                key={`${c.clause_ref}-${i}`}
                className="rounded-lg border border-coveru-border bg-coveru-light p-2 text-xs"
              >
                <p className="font-semibold">{c.clause_ref}</p>
                <p className="text-coveru-gray">{c.policy_document_title}</p>
                <p className="mt-1 italic">&ldquo;{c.excerpt}&rdquo;</p>
                {c.page_number != null && (
                  <p className="mt-1 text-coveru-gray">Pág. {c.page_number}</p>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

    </div>
  );
}
