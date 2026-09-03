import { getCurrentUser } from "@/lib/auth/org";
import { createClient } from "@/lib/supabase/server";

export type PublicAuthNav = {
  isLoggedIn: boolean;
  isDemoMode: boolean;
  href: string;
  label: string;
};

export async function getPublicAuthNav(): Promise<PublicAuthNav> {
  const supabase = await createClient();
  const isDemoMode = !supabase;
  const user = await getCurrentUser();

  if (user) {
    return {
      isLoggedIn: true,
      isDemoMode,
      href: "/app/marketplace",
      label: "Mi panel",
    };
  }

  return {
    isLoggedIn: false,
    isDemoMode,
    href: "/login",
    label: "Iniciar sesión",
  };
}
