import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ComparisonGate } from "@/components/comparar/ComparisonGate";
import type { PublicQuoteResult } from "@/lib/quoters/types";

function quote(overrides: Partial<PublicQuoteResult> = {}): PublicQuoteResult {
  return {
    request: { age: 30, gender: "femenino", region: "Nacional" },
    offers: [
      {
        planId: "plan-1",
        planName: "PRO150-150",
        insurerName: "Saludsa",
        insurerSlug: "saludsa",
        insurerLogoUrl: "/insurers/saludsa.svg",
        monthlyPrice: 74.5,
        deductible: 5000,
        annualLimit: null,
        region: "Nacional",
        ageMin: 24,
        ageMax: 31,
        gender: "femenino",
        isDemo: false,
      },
      {
        planId: "plan-2",
        planName: "GMM Tarifa 10K - Sierra",
        insurerName: "BMI",
        insurerSlug: "bmi",
        insurerLogoUrl: "/insurers/bmi.png",
        monthlyPrice: 20.32,
        deductible: 10000,
        annualLimit: null,
        region: "Sierra",
        ageMin: 30,
        ageMax: 30,
        gender: "any",
        isDemo: false,
      },
    ],
    totalOffers: 2,
    source: "bundled-catalog",
    ...overrides,
  };
}

function mockFetch(body: PublicQuoteResult) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ComparisonGate", () => {
  it("shows the server quote on first paint without a request", () => {
    const fetchMock = mockFetch(quote());
    render(<ComparisonGate initialQuote={quote()} />);

    expect(screen.getByText("PRO150-150")).toBeInTheDocument();
    expect(screen.getByText("Desde")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requests Ecuador regions and shows the new results", async () => {
    const fetchMock = mockFetch(
      quote({ request: { age: 45, gender: "masculino", region: "Costa" } }),
    );
    render(<ComparisonGate initialQuote={quote()} />);

    fireEvent.change(screen.getByLabelText("Edad"), { target: { value: "45" } });
    fireEvent.change(screen.getByLabelText("Género"), {
      target: { value: "masculino" },
    });
    fireEvent.change(screen.getByLabelText("Región"), {
      target: { value: "Costa" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar cotización" }));

    await waitFor(() => {
      expect(fetchMock).toHaveBeenCalledWith(
        "/api/compare?age=45&gender=masculino&region=Costa",
      );
    });
    await waitFor(() => {
      expect(screen.getByText(/2 planes para tu perfil/)).toBeInTheDocument();
    });
  });

  it("offers only Ecuador regions, not Chile-era values", () => {
    render(<ComparisonGate initialQuote={quote()} />);

    const region = screen.getByLabelText("Región") as HTMLSelectElement;
    const values = [...region.options].map((option) => option.value);
    expect(values).toEqual(["Nacional", "Austro", "Costa", "Sierra"]);
  });

  it("rejects an out-of-range age without calling the API", async () => {
    const fetchMock = mockFetch(quote());
    render(<ComparisonGate initialQuote={quote()} />);

    fireEvent.change(screen.getByLabelText("Edad"), { target: { value: "12" } });
    fireEvent.click(screen.getByRole("button", { name: "Actualizar cotización" }));

    expect(
      await screen.findByRole("alert"),
    ).toHaveTextContent(/entre 18 y 99 años/);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("surfaces a friendly error when the API fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => ({}) }),
    );
    render(<ComparisonGate initialQuote={quote()} />);

    fireEvent.click(screen.getByRole("button", { name: "Actualizar cotización" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No pudimos cargar las tarifas del catálogo/,
    );
  });

  it("shows an empty state when the profile has no plans", () => {
    render(
      <ComparisonGate
        initialQuote={quote({ offers: [], totalOffers: 0 })}
      />,
    );

    expect(
      screen.getByText("Sin planes para este perfil"),
    ).toBeInTheDocument();
  });

  it("warns that changed inputs are not yet reflected", () => {
    render(<ComparisonGate initialQuote={quote()} />);

    fireEvent.change(screen.getByLabelText("Edad"), { target: { value: "50" } });

    expect(
      screen.getByText(/Actualiza la cotización para ver las tarifas nuevas/),
    ).toBeInTheDocument();
  });

  it("caps the rendered plans and reports the total", () => {
    const many = Array.from({ length: 20 }, (_, index) => ({
      ...quote().offers[0]!,
      planId: `plan-${index}`,
      planName: `Plan ${index}`,
      monthlyPrice: 10 + index,
    }));

    render(
      <ComparisonGate
        initialQuote={quote({ offers: many, totalOffers: many.length })}
      />,
    );

    expect(screen.getAllByRole("heading", { level: 3 })).toHaveLength(12);
    expect(
      screen.getByText(/Mostrando los 12 planes más económicos de 20/),
    ).toBeInTheDocument();
  });
});
