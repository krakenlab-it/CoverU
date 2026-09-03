import { describe, expect, it, vi } from "vitest";
import { createConfirmedSignupUser } from "@/lib/auth/signup-server";

function createMockAdmin(createUserResult: {
  data?: { user?: { id: string } | null };
  error?: { message: string } | null;
}) {
  return {
    auth: {
      admin: {
        createUser: vi.fn().mockResolvedValue(createUserResult),
      },
    },
  };
}

describe("createConfirmedSignupUser", () => {
  it("creates a confirmed user with organization metadata", async () => {
    const admin = createMockAdmin({
      data: { user: { id: "user-123" } },
      error: null,
    });

    const result = await createConfirmedSignupUser(
      admin as never,
      {
        email: "user@example.com",
        password: "password123",
        organizationName: "Mi Org",
      },
    );

    expect(result).toEqual({ ok: true, userId: "user-123" });
    expect(admin.auth.admin.createUser).toHaveBeenCalledWith({
      email: "user@example.com",
      password: "password123",
      email_confirm: true,
      user_metadata: {
        organization_name: "Mi Org",
      },
    });
  });

  it("returns email_exists when the user is already registered", async () => {
    const admin = createMockAdmin({
      data: { user: null },
      error: {
        message: "A user with this email address has already been registered",
      },
    });

    const result = await createConfirmedSignupUser(
      admin as never,
      {
        email: "existing@example.com",
        password: "password123",
        organizationName: "Mi Org",
      },
    );

    expect(result).toEqual({ ok: false, code: "email_exists" });
  });

  it("returns unknown when createUser fails for other reasons", async () => {
    const admin = createMockAdmin({
      data: { user: null },
      error: { message: "Database error" },
    });

    const result = await createConfirmedSignupUser(
      admin as never,
      {
        email: "user@example.com",
        password: "password123",
        organizationName: "Mi Org",
      },
    );

    expect(result).toEqual({ ok: false, code: "unknown" });
  });
});
