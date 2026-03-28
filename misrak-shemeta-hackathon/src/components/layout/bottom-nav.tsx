"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, ShoppingCart, Package, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";

export function BottomNav() {
  const pathname = usePathname();
  const { t } = useLocale();

  const items = [
    { href: "/", label: t("nav.home"), icon: Home },
    { href: "/products", label: t("nav.browse"), icon: LayoutGrid },
    { href: "/cart", label: t("nav.cart"), icon: ShoppingCart },
    { href: "/orders", label: t("nav.orders"), icon: Package },
    { href: "/profile", label: t("nav.profile"), icon: User },
  ];

  if (pathname.startsWith("/pitch")) return null;

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 border-t border-brand-100 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg md:hidden"
      aria-label="Primary"
    >
      <div className="mx-auto flex max-w-6xl justify-around px-1 pt-1">
        {items.map(({ href, label, icon: Icon }) => {
          const active =
            href === "/"
              ? pathname === "/"
              : pathname === href || pathname.startsWith(`${href}/`);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex min-h-12 min-w-[3.5rem] flex-1 flex-col items-center justify-center gap-0.5 rounded-xl py-1 text-[10px] font-semibold transition-colors",
                active
                  ? "text-brand-600"
                  : "text-brand-400 hover:text-brand-600"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
              <span className="max-w-[4.2rem] truncate">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
