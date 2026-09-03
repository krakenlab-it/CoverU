import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SetupError } from "@/components/platform/SetupError";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";

describe("SetupError", () => {
  it("shows which env vars are missing vs present", () => {
    const diagnostics = buildCoveruEnvDiagnostics({
      url: "https://abc123.supabase.co",
      anonKey: "",
      includeServiceRole: false,
    });

    render(<SetupError diagnostics={diagnostics} />);

    expect(screen.getByText("Configuración requerida")).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_SUPABASE_URL/).closest("li")).toHaveTextContent(
      "presente",
    );
    expect(screen.getByText(/host: abc123\.supabase\.co/)).toBeInTheDocument();
    expect(screen.getByText(/NEXT_PUBLIC_SUPABASE_ANON_KEY/).closest("li")).toHaveTextContent(
      "ausente",
    );
    expect(screen.getByText(/SUPABASE_SERVICE_ROLE_KEY/).closest("li")).toHaveTextContent(
      "ausente",
    );
  });

  it("shows anon key length and prefix kind when present", () => {
    const diagnostics = buildCoveruEnvDiagnostics({
      url: "",
      anonKey: "eyJhbGciOiJIUzI1NiJ9",
      includeServiceRole: true,
    });

    render(<SetupError diagnostics={diagnostics} />);

    expect(screen.getByText(/NEXT_PUBLIC_SUPABASE_URL/).closest("li")).toHaveTextContent(
      "ausente",
    );
    expect(screen.getByText(/NEXT_PUBLIC_SUPABASE_ANON_KEY/).closest("li")).toHaveTextContent(
      "presente",
    );
    expect(screen.getByText(/longitud: 20, prefijo: eyJ/)).toBeInTheDocument();
    expect(screen.getByText(/SUPABASE_SERVICE_ROLE_KEY/).closest("li")).toHaveTextContent(
      "ausente",
    );
  });

  it("does not render raw secret values", () => {
    const secretAnon = "eyJhbGciOiJIUzI1NiJ9.super-secret-anon-key";
    const diagnostics = buildCoveruEnvDiagnostics({
      url: "https://abc123.supabase.co",
      anonKey: secretAnon,
      includeServiceRole: false,
    });

    const { container } = render(<SetupError diagnostics={diagnostics} />);

    expect(container.textContent).not.toContain(secretAnon);
    expect(container.textContent).not.toContain("super-secret-anon-key");
  });
});
