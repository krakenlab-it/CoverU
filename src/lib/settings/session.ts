import {
  requireAuthWithOrg,
  userBelongsToOrg,
  type OrgMembership,
} from "@/lib/auth/org";
import { isSupabaseAdminConfigured } from "@/lib/supabase/config";

export interface SettingsSession {
  userId: string;
  email: string | null;
  organizationId: string;
  organizationName: string;
  role: string;
  canAdminister: boolean;
  memberships: OrgMembership[];
  serviceConfigured: boolean;
}

export function isOrgAdminRole(role: string): boolean {
  return role === "owner" || role === "admin";
}

export async function requireSettingsSession(): Promise<SettingsSession | null> {
  const session = await requireAuthWithOrg();
  if (!session) return null;

  const membership = session.memberships[0];
  if (!membership) return null;

  return {
    userId: session.user.id,
    email: session.user.email,
    organizationId: membership.organizationId,
    organizationName: membership.organizationName,
    role: membership.role,
    canAdminister: isOrgAdminRole(membership.role),
    memberships: session.memberships,
    serviceConfigured: isSupabaseAdminConfigured(),
  };
}

export async function requireSettingsSessionForOrg(
  organizationId: string,
): Promise<SettingsSession | null> {
  const settingsSession = await requireSettingsSession();
  if (!settingsSession) return null;

  if (!userBelongsToOrg(settingsSession.memberships, organizationId)) {
    return null;
  }

  return settingsSession;
}

export function hasServiceRole(): boolean {
  return isSupabaseAdminConfigured();
}
