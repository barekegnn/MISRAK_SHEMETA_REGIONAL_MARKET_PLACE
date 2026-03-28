import type { UserRole } from "@/types";

/** Paths that need any signed-in user (buyer flows). */
const AUTH_PREFIXES = ["/checkout", "/cart", "/orders"];

/** Paths restricted to a specific `public.users.role`. */
const ROLE_BY_PREFIX: Array<{ prefix: string; role: UserRole }> = [
  { prefix: "/admin", role: "admin" },
  { prefix: "/runner", role: "runner" },
  { prefix: "/merchant", role: "seller" },
];

function matchesPrefix(pathname: string, prefix: string) {
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

/** Catalog, marketing, auth, legal browsing — no session required. */
export function isPublicPath(pathname: string): boolean {
  if (pathname === "/") return true;
  if (matchesPrefix(pathname, "/auth")) return true;
  if (matchesPrefix(pathname, "/products")) return true;
  if (matchesPrefix(pathname, "/shops")) return true;
  if (matchesPrefix(pathname, "/pitch")) return true;
  if (matchesPrefix(pathname, "/demo")) return true;
  if (pathname === "/profile") return true;
  if (pathname === "/seller") return true;
  if (matchesPrefix(pathname, "/dashboards")) return true;
  return false;
}

/** Login required (buyer flows); role dashboards use `requiredRole` instead. */
export function requiresAuth(pathname: string): boolean {
  return AUTH_PREFIXES.some((p) => matchesPrefix(pathname, p));
}

export function requiredRole(pathname: string): UserRole | null {
  for (const { prefix, role } of ROLE_BY_PREFIX) {
    if (matchesPrefix(pathname, prefix)) return role;
  }
  return null;
}
