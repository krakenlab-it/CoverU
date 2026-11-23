import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LeadCaptureForm } from "@/components/comparar/LeadCaptureForm";

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fillRequiredFields() {
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Ana Pérez" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ana@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Ciudad"), {
    target: { value: "Quito" },
  });
}

function acceptConsent() {
  fireEvent.click(screen.getByLabelText(/Acepto que CoverÜ/));
}

function sentBody(fetchMock: ReturnType<typeof mockFetch>) {
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  return JSON.parse(String(init.body)) as Record<string, unknown>;
}

function renderForm() {
  return render(
    <LeadCaptureForm
      age="34"
      profileSummary="34 años · Femenino · Sierra"
      source="cotizador"
    />,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("LeadCaptureForm", () => {
  it("renders the qualification fields and both actions", () => {
    renderForm();

    expect(screen.getByLabelText("Dependientes")).toBeInTheDocument();
    expect(screen.getByLabelText("Ciudad")).toBeInTheDocument();
    expect(screen.getByLabelText(/Presupuesto mensual/)).toBeInTheDocument();
    expect(screen.getByLabelText("Seguro actual (opcional)")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Hablar con un asesor" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Enviar mis datos" }),
    ).toBeInTheDocument();
  });

  it("blocks the submission when consent is not given", async () => {
    const fetchMock = mockFetch({ success: true });
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mis datos" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /consentimiento/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("blocks an advisor request without consent", async () => {
    const fetchMock = mockFetch({ success: true });
    renderForm();

    fillRequiredFields();
    fireEvent.click(screen.getByRole("button", { name: "Hablar con un asesor" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /consentimiento/i,
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("requires a city", async () => {
    const fetchMock = mockFetch({ success: true });
    renderForm();

    fireEvent.change(screen.getByLabelText("Nombre"), {
      target: { value: "Ana Pérez" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "ana@example.com" },
    });
    acceptConsent();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mis datos" }));

    expect(await screen.findByText("Ciudad requerida")).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("rejects an invalid dependents count", async () => {
    const fetchMock = mockFetch({ success: true });
    renderForm();

    fillRequiredFields();
    acceptConsent();
    fireEvent.change(screen.getByLabelText("Dependientes"), {
      target: { value: "42" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Enviar mis datos" }));

    expect(
      await screen.findByText(/Ingresa entre 0 y 20 dependientes/),
    ).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a quote lead with the qualification profile", async () => {
    const fetchMock = mockFetch({
      success: true,
      demo: true,
      needs_human_followup: false,
    });
    renderForm();

    fillRequiredFields();
    fireEvent.change(screen.getByLabelText("Dependientes"), {
      target: { value: "2" },
    });
    fireEvent.change(screen.getByLabelText(/Presupuesto mensual/), {
      target: { value: "90" },
    });
    fireEvent.change(screen.getByLabelText("Seguro actual (opcional)"), {
      target: { value: "Ninguno" },
    });
    acceptConsent();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mis datos" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const body = sentBody(fetchMock);
    expect(body).toMatchObject({
      intent: "quote",
      name: "Ana Pérez",
      email: "ana@example.com",
      source: "cotizador",
      consent: true,
      qualification: {
        age: 34,
        dependents: 2,
        city: "Quito",
        budget: 90,
        current_insurance: "Ninguno",
      },
    });
    expect(body).not.toHaveProperty("needs_human_followup");

    expect(
      await screen.findByText(/Guardamos tus datos para dar seguimiento/),
    ).toBeInTheDocument();
  });

  it("submits an advisor lead and confirms the human follow-up", async () => {
    const fetchMock = mockFetch({
      success: true,
      demo: true,
      needs_human_followup: true,
    });
    renderForm();

    fillRequiredFields();
    acceptConsent();
    fireEvent.click(screen.getByRole("button", { name: "Hablar con un asesor" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    expect(sentBody(fetchMock).intent).toBe("advisor");

    expect(
      await screen.findByText(/Un asesor te contactará/),
    ).toBeInTheDocument();
  });

  it("omits an undeclared budget instead of sending zero", async () => {
    const fetchMock = mockFetch({ success: true, needs_human_followup: false });
    renderForm();

    fillRequiredFields();
    acceptConsent();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mis datos" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const body = sentBody(fetchMock) as {
      qualification: { budget: number | null; current_insurance: string | null };
    };
    expect(body.qualification.budget).toBeNull();
    expect(body.qualification.current_insurance).toBeNull();
  });

  it("surfaces the API error message", async () => {
    mockFetch({ error: "No pudimos guardar tu solicitud." }, false);
    renderForm();

    fillRequiredFields();
    acceptConsent();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mis datos" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      /No pudimos guardar tu solicitud/,
    );
  });
});
