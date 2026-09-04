"use client";

import { useCallback, useState } from "react";
import type { CoverageQaResult } from "@/lib/types/phase1";

export const COVERAGE_SUGGESTED_QUESTIONS = [
  "hombre 35 Costa titular",
  "¿Cuál es el precio mensual?",
  "¿Incluye maternidad?",
  "comparar edad 25 y 45",
  "¿Está cubierta la hospitalización?",
] as const;

export interface CoverageChatMessage {
  id: string;
  role: "user" | "assistant";
  question?: string;
  result?: CoverageQaResult;
  error?: string;
}

export function useCoverageAssistantChat(planVersionId: string) {
  const [messages, setMessages] = useState<CoverageChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const askQuestion = useCallback(
    async (question: string) => {
      const trimmed = question.trim();
      if (trimmed.length < 3 || loading) return;

      const userMsg: CoverageChatMessage = {
        id: `u-${Date.now()}`,
        role: "user",
        question: trimmed,
      };

      setMessages((prev) => [...prev, userMsg]);
      setInput("");
      setLoading(true);

      try {
        const history = messages
          .filter((message) => message.role === "user" && message.question)
          .slice(-6)
          .map((message) => ({ question: message.question as string }));

        const res = await fetch("/api/app/coverage/qa", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            plan_version_id: planVersionId,
            question: trimmed,
            history,
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
    [loading, planVersionId, messages],
  );

  return {
    messages,
    input,
    setInput,
    loading,
    askQuestion,
  };
}
