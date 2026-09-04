import { renderHook, act } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { useCoverageAssistantChat } from "@/hooks/use-coverage-assistant-chat";

describe("useCoverageAssistantChat", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("sends previous questions as history so the harness keeps context", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        data: {
          status: "quoted",
          answer: "ok",
          citations: [],
          matched_tariff: null,
          abstained: false,
          policy_wording_controls: false,
          provider: "rules",
        },
      }),
    });
    vi.stubGlobal("fetch", fetchMock);

    const { result } = renderHook(() =>
      useCoverageAssistantChat("d1000000-0000-4000-8000-000000000001"),
    );

    await act(async () => {
      await result.current.askQuestion("hombre 35 Costa titular");
    });
    await act(async () => {
      await result.current.askQuestion("y si es mujer");
    });

    const secondBody = JSON.parse(
      (fetchMock.mock.calls[1][1] as { body: string }).body,
    ) as { history: Array<{ question: string }> };
    expect(secondBody.history).toEqual([
      { question: "hombre 35 Costa titular" },
    ]);
  });
});
