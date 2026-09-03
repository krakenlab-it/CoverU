import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
let searchParams = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
  useSearchParams: () => searchParams,
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      signInWithPassword: vi.fn(),
    },
  })),
}));

const emptyDiagnostics = buildCoveruEnvDiagnostics({
  route: "/login",
  url: "",
  anonKey: "",
  includeServiceRole: false,
});

const configuredDiagnostics = buildCoveruEnvDiagnostics({
  route: "/login",
  url: "https://example.supabase.co",
  anonKey: "test-anon-key",
  includeServiceRole: false,
});

describe("LoginForm", () => {
  it("renders SetupError when url and anon key are empty", () => {
    searchParams = new URLSearchParams();

    render(
      <LoginForm
        supabaseUrl=""
        supabaseAnonKey=""
        envDiagnostics={emptyDiagnostics}
      />,
    );

    expect(screen.getByText("Configuración requerida")).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_SUPABASE_URL/).closest("li")).toHaveTextContent(
      "ausente",
    );
    expect(
      screen.queryByRole("button", { name: /iniciar sesión/i }),
    ).not.toBeInTheDocument();
  });

  it("logs setup diagnostics to the console when configuration is missing", () => {
    searchParams = new URLSearchParams();
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    render(
      <LoginForm
        supabaseUrl=""
        supabaseAnonKey=""
        envDiagnostics={emptyDiagnostics}
      />,
    );

    expect(warnSpy).toHaveBeenCalledWith(
      "[coveru-env]",
      expect.stringContaining('"route":"/login"'),
    );
    expect(warnSpy).toHaveBeenCalledWith(
      "[coveru-env]",
      expect.not.stringContaining("test-anon-key"),
    );

    warnSpy.mockRestore();
  });

  it("renders the login form when url and anon key props are set", () => {
    searchParams = new URLSearchParams();

    render(
      <LoginForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Contraseña")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Configuración requerida"),
    ).not.toBeInTheDocument();
  });

  it("renders the login form when configured even with ?error=setup", () => {
    searchParams = new URLSearchParams("error=setup&redirect=/app");

    render(
      <LoginForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Configuración requerida"),
    ).not.toBeInTheDocument();
  });

  it("renders links to registro and recuperar", () => {
    searchParams = new URLSearchParams();

    render(
      <LoginForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    expect(screen.getByRole("link", { name: /registrarse/i })).toHaveAttribute(
      "href",
      "/registro",
    );
    expect(
      screen.getByRole("link", { name: /olvidaste tu contraseña/i }),
    ).toHaveAttribute("href", "/recuperar");
  });
});
