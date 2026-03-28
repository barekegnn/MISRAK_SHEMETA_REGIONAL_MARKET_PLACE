import type { User as SupabaseUser } from "@supabase/supabase-js";
import type { DeliveryZone, Language, User, UserRole } from "@/types";

export const DEFAULT_DELIVERY_ZONE: DeliveryZone = "Haramaya_Campus";
export const DEFAULT_LANGUAGE: Language = "en";

export function isMarketplaceBuyer(user: User | null): boolean {
  return Boolean(user && user.role === "buyer");
}

export function mapSupabaseUser(su: SupabaseUser): User {
  return {
    id: su.id,
    email: su.email ?? "",
    full_name:
      (su.user_metadata?.full_name as string | undefined) ??
      su.email?.split("@")[0] ??
      "Buyer",
    role: (su.user_metadata?.role as UserRole) ?? "buyer",
    delivery_zone:
      (su.user_metadata?.delivery_zone as DeliveryZone) ?? DEFAULT_DELIVERY_ZONE,
    language: (su.user_metadata?.language as Language) ?? DEFAULT_LANGUAGE,
    phone: (su.user_metadata?.phone as string | undefined) ?? null,
    created_at: su.created_at,
  };
}

export function getDashboardRoute(role: UserRole) {
  switch (role) {
    case "admin":
      return "/admin";
    case "seller":
      return "/merchant";
    case "runner":
      return "/runner";
    case "buyer":
    default:
      return "/dashboard";
  }
}

export function getRoleLabel(role: UserRole) {
  switch (role) {
    case "admin":
      return "Admin";
    case "seller":
      return "Seller";
    case "runner":
      return "Runner";
    case "buyer":
    default:
      return "Buyer";
  }
}

export type WorkspaceNavItem = {
  href: string;
  label: string;
};

export function getWorkspaceNavItems(role: UserRole): WorkspaceNavItem[] {
  switch (role) {
    case "admin":
      return [{ href: "/admin", label: "Overview" }];
    case "seller":
      return [
        { href: "/merchant", label: "Dashboard" },
        { href: "/merchant/products", label: "Products" },
        { href: "/merchant/orders", label: "Orders" },
        { href: "/merchant/products/new", label: "New product" },
        { href: "/account", label: "Account" },
      ];
    case "runner":
      return [
        { href: "/runner", label: "Orders & deliveries" },
        { href: "/account", label: "Account" },
      ];
    case "buyer":
    default:
      return [
        { href: "/dashboard", label: "Overview" },
        { href: "/orders", label: "Orders" },
        { href: "/account", label: "Account" },
      ];
  }
}
