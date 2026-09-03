import { getCurrentUser } from "@/lib/auth/org";

export type PublicAuthNav = {
  isLoggedIn: boolean;
  href: string;
  label: string;
};

export async function getPublicAuthNav(): Promise<PublicAuthNav> {
  const user = await getCurrentUser();

  if (user) {
    return {
      isLoggedIn: true,
      href: "/app/marketplace",
      label: "Mi panel",
    };
  }

  return {
    isLoggedIn: false,
    href: "/login",
    label: "Iniciar sesión",
  };
}
