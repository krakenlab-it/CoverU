"use client";

import { useCallback, useState } from "react";
import { VerdictBadge } from "@/components/marketplace/VerdictBadge";
import type { CoverageCitation, CoverageQaResult } from "@/lib/types/phase1";

const SUGGESTED_QUESTIONS = [
  "¿Está cubierta la hospitalización?",
  "¿Qué pasa con las urgencias fuera de red?",
  "¿Incluye maternidad?",
  "¿Hay carencia para cirugías programadas?",
  "¿Cubren tratamientos cosméticos?",
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
        Preguntas sobre <strong>{planName}</strong>. Las respuestas se basan
        únicamente en los documentos de la póliza — nunca en conocimiento general.
      </p>

      <div
        className="mt-4 max-h-96 space-y-4 overflow-y-auto rounded-xl bg-coveru-light p-4"
        aria-live="polite"
        aria-label="Historial de conversación"
      >
        {messages.length === 0 && (
          <p className="text-sm text-coveru-gray">
            Haz una pregunta sobre coberturas de este plan.
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
            {msg.result && (
              <AssistantAnswer result={msg.result} />
            )}
          </div>
        ))}
        {loading && (
          <p className="text-sm text-coveru-gray" aria-busy="true">
            Consultando documentos de la póliza…
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
          placeholder="Ej. ¿Está cubierta la cirugía de rodilla?"
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

      {result.abstained && (
        <p className="mt-2 rounded-lg bg-gray-100 p-2 text-xs text-gray-700" role="note">
          No encontré respuesta en los documentos de esta póliza. Consulta con un
          asesor o revisa el texto completo de la póliza.
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
