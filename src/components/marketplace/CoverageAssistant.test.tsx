import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CoverageAssistant } from "@/components/marketplace/CoverageAssistant";

describe("CoverageAssistant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows suggested questions and submits to API", async () => {
    const mockResult = {
      status: "covered" as const,
      answer: "La hospitalización está cubierta según la póliza.",
      citations: [
        {
          clause_ref: "Art. 4.1",
          excerpt: "Hospitalización en red preferente.",
          page_number: 12,
          policy_document_title: "[DEMO] Condiciones Generales",
        },
      ],
      abstained: false,
      policy_wording_controls: true,
      provider: "demo",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResult }),
      }),
    );

    render(
      <CoverageAssistant
        planVersionId="d1000000-0000-4000-8000-000000000001"
        planName="[DEMO] Plan Básico Alpha"
      />,
    );

    expect(
      screen.getByText(/únicamente en los documentos de la póliza/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /¿Está cubierta la hospitalización/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("Cubierto")).toBeInTheDocument();
      expect(
        screen.getByText(/La hospitalización está cubierta/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Art. 4.1")).toBeInTheDocument();
    });
  });

  it("handles unknown/abstained responses", async () => {
    const mockResult = {
      status: "unknown" as const,
      answer: "No encontré información en la póliza.",
      citations: [],
      abstained: true,
      policy_wording_controls: true,
      provider: "demo",
    };

    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ data: mockResult }),
      }),
    );

    render(
      <CoverageAssistant
        planVersionId="d1000000-0000-4000-8000-000000000001"
        planName="Test Plan"
      />,
    );

    const input = screen.getByLabelText(/Tu pregunta sobre cobertura/i);
    fireEvent.change(input, {
      target: { value: "¿Cubren viajes al espacio?" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Preguntar" }));

    await waitFor(() => {
      expect(screen.getByText("Sin respuesta en póliza")).toBeInTheDocument();
      expect(
        screen.getByText(/No encontré respuesta en los documentos/i),
      ).toBeInTheDocument();
    });
  });
});
