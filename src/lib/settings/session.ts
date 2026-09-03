import {
  requireAuthWithOrg,
  userBelongsToOrg,
  type OrgMembership,
} from "@/lib/auth/org";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export interface SettingsSession {
  userId: string;
  email: string | null;
  organizationId: string;
  organizationName: string;
  role: string;
  isDemo: boolean;
  isDemoMode: boolean;
  canAdminister: boolean;
  memberships: OrgMembership[];
}

export function isOrgAdminRole(role: string): boolean {
  return role === "owner" || role === "admin";
}

export async function requireSettingsSession(): Promise<SettingsSession | null> {
  const session = await requireAuthWithOrg();
  if (!session) return null;

  const supabase = await createClient();
  const isDemoMode = !supabase;
  const membership = session.memberships[0];

  if (!membership) return null;

  const isDemo =
    membership.isDemo || isDemoMode || session.memberships.every((m) => m.isDemo);

  return {
    userId: session.user.id,
    email: session.user.email,
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    role: membership.role,
    isDemo,
    isDemoMode,
    canAdminister: isOrgAdminRole(membership.role),
    memberships: session.memberships,
  };
}

export async function requireSettingsSessionForOrg(
  organizationId: string,
): Promise<SettingsSession | null> {
  const settingsSession = await requireSettingsSession();
  if (!settingsSession) return null;

  if (
    !userBelongsToOrg(settingsSession.memberships, organizationId) &&
    !settingsSession.isDemoMode
  ) {
    return null;
  }

  return settingsSession;
}

export function hasServiceRole(): boolean {
  return createAdminClient() !== null;
}
