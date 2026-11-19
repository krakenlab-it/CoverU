import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ContactForm } from "@/components/contacto/ContactForm";

function mockFetch(body: unknown, ok = true) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok,
    json: async () => body,
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function fillContactForm() {
  fireEvent.change(screen.getByLabelText("Nombre"), {
    target: { value: "Ana Pérez" },
  });
  fireEvent.change(screen.getByLabelText("Email"), {
    target: { value: "ana@example.com" },
  });
  fireEvent.change(screen.getByLabelText("Mensaje"), {
    target: { value: "Quiero asesoría." },
  });
}

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("ContactForm", () => {
  it("blocks submission until consent is given", () => {
    const fetchMock = mockFetch({ success: true });
    render(<ContactForm source="contacto" />);

    fillContactForm();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(screen.getByRole("alert")).toHaveTextContent(/consentimiento/i);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("submits a consented contact lead", async () => {
    const fetchMock = mockFetch({ success: true, demo: true });
    render(<ContactForm source="contacto" />);

    fillContactForm();
    fireEvent.click(screen.getByLabelText(/Acepto que CoverÜ/));
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());

    const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    const body = JSON.parse(String(init.body)) as Record<string, unknown>;
    expect(body).toMatchObject({
      intent: "contact",
      name: "Ana Pérez",
      email: "ana@example.com",
      source: "contacto",
      message: "Quiero asesoría.",
      consent: true,
    });
    expect(body).not.toHaveProperty("qualification");

    expect(await screen.findByRole("status")).toHaveTextContent(
      /¡Gracias! Recibimos tu mensaje/,
    );
  });

  it("clears the consent error once the visitor consents", () => {
    mockFetch({ success: true });
    render(<ContactForm />);

    fillContactForm();
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));
    expect(screen.getByRole("alert")).toBeInTheDocument();

    fireEvent.click(screen.getByLabelText(/Acepto que CoverÜ/));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("shows the API error", async () => {
    mockFetch({ error: "Datos inválidos" }, false);
    render(<ContactForm />);

    fillContactForm();
    fireEvent.click(screen.getByLabelText(/Acepto que CoverÜ/));
    fireEvent.click(screen.getByRole("button", { name: "Enviar mensaje" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Datos inválidos");
  });
});
