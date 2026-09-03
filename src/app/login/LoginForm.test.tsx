import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import LoginForm from "./LoginForm";

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

describe("LoginForm", () => {
  it("renders SetupError when url and anon key are empty", () => {
    searchParams = new URLSearchParams();

    render(<LoginForm supabaseUrl="" supabaseAnonKey="" />);

    expect(screen.getByText("Configuración requerida")).toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: /iniciar sesión/i }),
    ).not.toBeInTheDocument();
  });

  it("renders the login form when url and anon key props are set", () => {
    searchParams = new URLSearchParams();

    render(
      <LoginForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
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
      />,
    );

    expect(
      screen.getByRole("button", { name: /iniciar sesión/i }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Configuración requerida"),
    ).not.toBeInTheDocument();
  });
});
