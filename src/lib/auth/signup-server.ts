import type { SupabaseClient } from "@supabase/supabase-js";

export type SignupInput = {
  email: string;
  password: string;
  organizationName: string;
};

export type SignupErrorCode =
  | "invalid"
  | "email_exists"
  | "service_unavailable"
  | "unknown";

export type SignupResult =
  | { ok: true; userId: string }
  | { ok: false; code: SignupErrorCode };

function isEmailExistsError(message: string): boolean {
  const normalized = message.toLowerCase();
  return (
    normalized.includes("already been registered") ||
    normalized.includes("already registered") ||
    normalized.includes("user already exists") ||
    normalized.includes("email address has already")
  );
}

export async function createConfirmedSignupUser(
  admin: SupabaseClient,
  input: SignupInput,
): Promise<SignupResult> {
  const { data, error } = await admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      organization_name: input.organizationName,
    },
  });

  if (error) {
    if (isEmailExistsError(error.message)) {
      return { ok: false, code: "email_exists" };
    }

    return { ok: false, code: "unknown" };
  }

  if (!data.user?.id) {
    return { ok: false, code: "unknown" };
  }

  return { ok: true, userId: data.user.id };
}
