export const AUTH_MARKETING_ROUTES = [
  "/login",
  "/registro",
  "/recuperar",
  "/actualizar-contrasena",
] as const;

export function isAuthMarketingRoute(pathname: string): boolean {
  return AUTH_MARKETING_ROUTES.some(
    (route) => pathname === route || pathname.startsWith(`${route}/`),
  );
}
