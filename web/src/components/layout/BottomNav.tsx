"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/cart/context";
import { useAuth } from "@/lib/auth/context";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useI18n();
  const { itemCount } = useCart();
  const { user } = useAuth();
  const accountHref = user ? "/account" : "/auth";
  const ordersHref =
    user?.role === "seller"
      ? "/merchant/orders"
      : user?.role === "runner"
        ? "/runner"
        : user?.role === "admin"
          ? "/admin"
          : "/orders";

  const items = [
    { href: "/", icon: Home, label: t("home") },
    { href: "/products", icon: LayoutGrid, label: t("browse") },
    { href: "/cart", icon: ShoppingCart, label: t("cart"), badge: itemCount },
    { href: ordersHref, icon: Package, label: t("orders") },
    { href: accountHref, icon: User, label: t("account") },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-neutral-200 bg-white/95 pb-[env(safe-area-inset-bottom)] pt-1 md:hidden">
      <ul className="flex justify-around">
        {items.map(({ href, icon: Icon, label, badge }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);
          return (
            <li key={href}>
              <Link
                href={href}
                className={cn(
                  "relative flex flex-col items-center gap-0.5 px-2 py-2 text-[10px] font-medium",
                  active ? "text-[#4F46E5]" : "text-neutral-500",
                )}
              >
                <Icon className="size-5" />
                {label}
                {badge ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-4 justify-center rounded-full bg-amber-500 px-1 text-[9px] font-bold leading-4 text-neutral-900">
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
