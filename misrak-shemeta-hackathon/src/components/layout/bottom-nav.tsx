"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  LayoutGrid,
  ShoppingCart,
  Package,
  User,
  Search,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const items = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/shops", label: t("nav.browse"), icon: LayoutGrid },
    { href: "/products", label: t("nav.products"), icon: Search },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart },
    { href: "/orders", label: t("nav.orders"), icon: Package },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  if (pathname.startsWith("/pitch")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-100/90 bg-white/95 shadow-[0_-4px_24px_-8px_rgba(30,27,75,0.12)] pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      aria-label={t("nav.mainNav")}
    >
      <div className="mx-auto flex max-w-6xl justify-between gap-0.5 px-1 pt-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : href === "/shops"
                ? pathname === "/shops" || pathname.startsWith("/shops/")
                : href === "/products"
                  ? pathname === "/products" || pathname.startsWith("/products/")
                  : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-h-[3.25rem] min-w-0 flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 text-[10px] font-semibold transition-colors duration-150 active:bg-brand-50/80",
                active
                  ? "text-brand-700"
                  : "text-brand-400 hover:text-brand-700"
              )}
            >
              <span
                className={cn(
                  "flex h-9 w-9 items-center justify-center rounded-2xl transition-colors",
                  active ? "bg-brand-100 text-brand-700" : "text-current"
                )}
              >
                <Icon className={cn("h-[1.35rem] w-[1.35rem]", active && "stroke-[2.25]")} />
              </span>
              <span className="max-w-full truncate px-0.5">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
