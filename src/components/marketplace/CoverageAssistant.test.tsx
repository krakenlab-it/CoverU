import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { CoverageAssistant } from "@/components/marketplace/CoverageAssistant";

describe("CoverageAssistant", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("shows suggested questions and submits to API", async () => {
    const mockResult = {
      status: "quoted" as const,
      answer: "Para edad 35 · masculino · Costa · grupo titular, la prima mensual es $92,50.",
      citations: [],
      matched_tariff: {
        id: "tariff-1",
        age_min: 18,
        age_max: 64,
        gender: "masculino",
        region: "Costa",
        grupo_asegurado: "titular",
        maternidad: "No",
        deductible: 750,
        annual_limit: 100000,
        monthly_price: 92.5,
        tax_included: true,
      },
      abstained: false,
      policy_wording_controls: false,
      provider: "rules",
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
      screen.getByText(/tarifas del catálogo y, cuando exista texto de póliza/i),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("button", { name: /hombre 35 Costa titular/i }),
    );

    await waitFor(() => {
      expect(
        screen.getByText(/prima mensual es \$92,50/i),
      ).toBeInTheDocument();
      expect(screen.getByText("Tarifa coincidente")).toBeInTheDocument();
    });
  });

  it("handles unknown/abstained responses", async () => {
    const mockResult = {
      status: "unknown" as const,
      answer: "No hay texto de póliza disponible para responder esta pregunta.",
      citations: [],
      matched_tariff: null,
      abstained: true,
      policy_wording_controls: true,
      provider: "rules",
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
        screen.getByText(/No hay texto de póliza para esta pregunta/i),
      ).toBeInTheDocument();
    });
  });
});
