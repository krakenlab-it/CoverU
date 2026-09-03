import { createClient } from "@/lib/supabase/server";
import { DEMO_ORG_ID } from "@/lib/demo-api-data";

export interface AuthUser {
  id: string;
  email: string | null;
}

export interface OrgMembership {
  organizationId: string;
  role: string;
  organizationName: string;
  isDemo: boolean;
}

export async function getCurrentUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  if (!supabase) return null;

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  return { id: user.id, email: user.email ?? null };
}

export async function getUserOrgMemberships(
  userId: string,
): Promise<OrgMembership[]> {
  const supabase = await createClient();
  if (!supabase) {
    return [
      {
        organizationId: DEMO_ORG_ID,
        role: "admin",
        organizationName: "[DEMO] CoverÜ Partner Org",
        isDemo: true,
      },
    ];
  }

  const { data, error } = await supabase
    .from("organization_members")
    .select(
      `
      role,
      organization:organizations (
        id,
        name,
        is_demo
      )
    `,
    )
    .eq("user_id", userId)
    .eq("status", "active");

  if (error || !data) return [];

  return data
    .map((row) => {
      const org = row.organization as unknown as {
        id: string;
        name: string;
        is_demo: boolean;
      } | null;
      if (!org) return null;
      return {
        organizationId: org.id,
        role: row.role,
        organizationName: org.name,
        isDemo: org.is_demo,
      };
    })
    .filter((m): m is OrgMembership => m !== null);
}

export async function requireAuthWithOrg(): Promise<{
  user: AuthUser;
  memberships: OrgMembership[];
} | null> {
  const user = await getCurrentUser();

  if (!user) {
    const supabase = await createClient();
    if (!supabase) {
      return {
        user: { id: "demo-user", email: "demo@coveru.local" },
        memberships: [
          {
            organizationId: DEMO_ORG_ID,
            role: "admin",
            organizationName: "[DEMO] CoverÜ Partner Org",
            isDemo: true,
          },
        ],
      };
    }
    return null;
  }

  const memberships = await getUserOrgMemberships(user.id);
  if (memberships.length === 0 && (await createClient())) {
    return null;
  }

  return { user, memberships };
}

export function userBelongsToOrg(
  memberships: OrgMembership[],
  organizationId: string,
): boolean {
  return memberships.some((m) => m.organizationId === organizationId);
}
