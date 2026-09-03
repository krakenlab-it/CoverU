import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActualizarContrasenaForm from "./ActualizarContrasenaForm";
import { buildCoveruEnvDiagnostics } from "@/lib/supabase/env-diagnostics";

const mockPush = vi.fn();
const mockRefresh = vi.fn();
const getSession = vi.fn();
const updateUser = vi.fn();
const signOut = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: mockRefresh,
  }),
}));

vi.mock("@/lib/supabase/client", () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession,
      updateUser,
      signOut,
    },
  })),
}));

const configuredDiagnostics = buildCoveruEnvDiagnostics({
  route: "/actualizar-contrasena",
  url: "https://example.supabase.co",
  anonKey: "test-anon-key",
  includeServiceRole: false,
});

describe("ActualizarContrasenaForm", () => {
  it("renders password update form when configured", () => {
    render(
      <ActualizarContrasenaForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    expect(screen.getByLabelText(/nueva contraseña/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/confirmar contraseña/i)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /actualizar contraseña/i }),
    ).toBeInTheDocument();
  });

  it("redirects to login after successful password update", async () => {
    getSession.mockResolvedValueOnce({ data: { session: { access_token: "x" } } });
    updateUser.mockResolvedValueOnce({ error: null });
    signOut.mockResolvedValueOnce({ error: null });

    render(
      <ActualizarContrasenaForm
        supabaseUrl="https://example.supabase.co"
        supabaseAnonKey="test-anon-key"
        envDiagnostics={configuredDiagnostics}
      />,
    );

    fireEvent.change(screen.getByLabelText(/nueva contraseña/i), {
      target: { value: "newpassword123" },
    });
    fireEvent.change(screen.getByLabelText(/confirmar contraseña/i), {
      target: { value: "newpassword123" },
    });
    fireEvent.click(screen.getByRole("button", { name: /actualizar contraseña/i }));

    await waitFor(() => {
      expect(updateUser).toHaveBeenCalledWith({ password: "newpassword123" });
    });
    expect(signOut).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith("/login");
  });
});
