import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import RegistroForm from "./RegistroForm";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";

const mockPush = vi.fn();
const mockRefresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

const signUp = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signUp,
    },
    rpc,
  })),
}));

const emptyDiagnostics = buildCoveruEnvDiagnostics({
  route: "/registro",
  url: "",
  anonKey: "",
  includeServiceRole: false,
});

const configuredDiagnostics = buildCoveruEnvDiagnostics({
  route: "/registro",
  url: "https://example.supabase.co",
  anonKey: "test-anon-key",
  includeServiceRole: false,
});

describe("RegistroForm", () => {
  it("renders SetupError when configuration is missing", () => {
    render(
      <RegistroForm
        supabaseUrl=""
        supabaseAnonKey=""
        envDiagnostics={emptyDiagnostics}
      />,
    );

    expect(screen.getByText("Configuración requerida")).toBeInTheDocument();
  });

  it("renders signup fields when configured", () => {
    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    expect(screen.getByLabelText(/nombre de la organización/i)).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText(/^Contraseña$/)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /crear cuenta/i }),
    ).toBeInTheDocument();
  });

  it("shows confirm-email message when signup returns no session", async () => {
    signUp.mockResolvedValueOnce({ data: { session: null }, error: null });

    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre de la organización/i), {
      target: { value: "Mi Org" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(signUp).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "user@example.com",
        password: "password123",
        options: expect.objectContaining({
          data: { organization_name: "Mi Org" },
        }),
      }),
    );
    expect(await screen.findByText(/revisa tu correo/i)).toBeInTheDocument();
  });

  it("redirects to /app when signup returns a session", async () => {
    signUp.mockResolvedValueOnce({
      data: { session: { access_token: "token" } },
      error: null,
    });
    rpc.mockResolvedValueOnce({ error: null });

    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nombre de la organización/i), {
      target: { value: "Mi Org" },
    });
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "user@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/^Contraseña$/), {
      target: { value: "password123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "password123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("provision_my_organization", {
        p_organization_name: "Mi Org",
      });
    });
    expect(mockPush).toHaveBeenCalledWith("/app");
  });
});
