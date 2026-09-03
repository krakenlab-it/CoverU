import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RecuperarForm from "./RecuperarForm";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: vi.fn(),
    refresh: vi.fn(),
  }),
}));

const resetPasswordForEmail = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      resetPasswordForEmail,
    },
  })),
}));

const configuredDiagnostics = buildCoveruEnvDiagnostics({
  route: "/recuperar",
  url: "https://example.supabase.co",
  anonKey: "test-anon-key",
  includeServiceRole: false,
});

describe("RecuperarForm", () => {
  it("renders recovery form when configured", () => {
    render(
      <RecuperarForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /enviar enlace/i })).toBeInTheDocument();
  });

  it("shows confirmation after reset email is sent", async () => {
    resetPasswordForEmail.mockResolvedValueOnce({ error: null });

    render(
      <RecuperarForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.click(screen.getByRole("button", { name: /enviar enlace/i }));

    expect(resetPasswordForEmail).toHaveBeenCalledWith(
      "user@example.com",
      expect.objectContaining({
        redirectTo: expect.stringContaining("/auth/callback?next=%2Factualizar-contrasena"),
      }),
    );
    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument();
  });
});
