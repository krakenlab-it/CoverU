import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi, beforeEach } from "vitest";
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

const signInWithPassword = vi.fn();
const rpc = vi.fn();

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword,
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

function fillSignupForm() {
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
}

describe("RegistroForm", () => {
  beforeEach(() => {
    mockPush.mockReset();
    mockRefresh.mockReset();
    signInWithPassword.mockReset();
    rpc.mockReset();
    vi.stubGlobal("fetch", vi.fn());
  });

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

  it("redirects to /app after signup API success and sign-in", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ ok: true }), { status: 200 }),
    );
    signInWithPassword.mockResolvedValueOnce({ error: null });
    rpc.mockResolvedValueOnce({ error: null });

    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "user@example.com",
          password: "password123",
          organizationName: "Mi Org",
        }),
      });
    });

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalledWith({
        email: "user@example.com",
        password: "password123",
      });
    });

    await waitFor(() => {
      expect(rpc).toHaveBeenCalledWith("provision_my_organization", {
        p_organization_name: "Mi Org",
      });
    });

    expect(mockPush).toHaveBeenCalledWith("/app");
    expect(screen.queryByText(/revisa tu correo/i)).not.toBeInTheDocument();
  });

  it("signs in existing users when signup API returns email_exists", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "email_exists" }), { status: 409 }),
    );
    signInWithPassword.mockResolvedValueOnce({ error: null });
    rpc.mockResolvedValueOnce({ error: null });

    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    await waitFor(() => {
      expect(signInWithPassword).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/app");
    });
  });

  it("shows login guidance when existing email password is wrong", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "email_exists" }), { status: 409 }),
    );
    signInWithPassword.mockResolvedValueOnce({
      error: { message: "Invalid login credentials" },
    });

    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/ya existe una cuenta con este email/i),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /ir a iniciar sesión/i })).toHaveAttribute(
      "href",
      "/login",
    );
    expect(mockPush).not.toHaveBeenCalled();
  });

  it("shows an error when signup API fails", async () => {
    vi.mocked(fetch).mockResolvedValueOnce(
      new Response(JSON.stringify({ error: "unknown" }), { status: 500 }),
    );

    render(
      <RegistroForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fillSignupForm();
    fireEvent.click(screen.getByRole("button", { name: /crear cuenta/i }));

    expect(
      await screen.findByText(/no pudimos crear tu cuenta/i),
    ).toBeInTheDocument();
    expect(signInWithPassword).not.toHaveBeenCalled();
    expect(mockPush).not.toHaveBeenCalled();
  });
});
