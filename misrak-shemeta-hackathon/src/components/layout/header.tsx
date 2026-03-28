"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCart } from "@/app/actions/cart";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

const DEMO_ON = process.env.NEXT_PUBLIC_DEMO_MODE === "true";

function navActive(pathname: string, href: string) {
  if (href === "/shops") {
    return pathname === "/shops" || pathname.startsWith("/shops/");
  }
  if (href === "/products") {
    return pathname === "/products" || pathname.startsWith("/products/");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Header() {
  const pathname = usePathname();
  const { user, profile, signOut } = useAuth();
  const { t } = useLocale();
  const { data: cart = [] } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: () => getCart(),
    enabled: !!user,
    staleTime: 30_000,
  });
  const n = cart.reduce((acc, i) => acc + i.quantity, 0);

  const navItems: { href: string; label: string }[] = [
    { href: "/shops", label: t("nav.browse") },
    { href: "/products", label: t("nav.products") },
    { href: "/orders", label: t("nav.orders") },
  ];

  return (
    <header
      className={cn(
        "sticky z-50 border-b border-brand-100/90 bg-white/90 shadow-sm backdrop-blur-md supports-[backdrop-filter]:bg-white/80",
        DEMO_ON ? "top-10" : "top-0"
      )}
    >
      <div className="mx-auto flex max-w-6xl flex-col gap-0 px-4 pb-0 pt-1 sm:pt-2 md:pb-1">
        <div className="flex h-12 items-center gap-2 sm:h-[3.25rem] sm:gap-3 md:h-[3.5rem]">
        <Link
          href="/"
          className="flex shrink-0 items-center gap-2 rounded-xl font-display text-base font-bold tracking-tight text-brand-900 outline-none ring-brand-500/40 transition-opacity hover:opacity-90 focus-visible:ring-2 sm:text-lg"
          aria-label={t("nav.home")}
        >
          <span className="text-2xl leading-none" aria-hidden>
            🌅
          </span>
          <span className="hidden min-[380px]:inline">Misrak Shemeta</span>
        </Link>

        <div className="flex flex-1 justify-end md:contents">
        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2 md:order-last md:flex-1 md:justify-end">
          <LanguageSwitcher className="scale-90 sm:scale-100" />

          <Link href="/cart" className="relative touch-manipulation">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-xl shadow-sm"
              aria-label={t("nav.cart")}
            >
              <ShoppingCart className="h-5 w-5" />
              {n > 0 && (
                <Badge className="absolute -right-1 -top-1 flex h-5 min-w-5 justify-center rounded-full px-1 text-[10px] tabular-nums">
                  {n > 99 ? "99+" : n}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-1 sm:gap-2">
              <Link
                href="/profile"
                className="rounded-full ring-brand-500/30 transition-shadow hover:ring-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2"
              >
                <Avatar className="h-9 w-9 border border-brand-100 sm:h-10 sm:w-10">
                  <AvatarFallback className="bg-brand-100 text-sm font-semibold text-brand-800">
                    {(profile?.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button
                variant="ghost"
                size="sm"
                className="hidden rounded-xl text-xs font-medium text-brand-700 lg:inline-flex"
                onClick={() => void signOut()}
              >
                {t("common.signOut")}
              </Button>
            </div>
          ) : (
            <Button asChild size="sm" className="rounded-xl px-3 sm:px-4">
              <Link href="/auth">{t("auth.signIn")}</Link>
            </Button>
          )}
        </div>
        </div>
        </div>

        <nav
          className="-mx-1 mb-1 flex gap-0.5 overflow-x-auto scroll-smooth px-1 pb-2 md:mx-0 md:mb-0 md:justify-center md:overflow-visible md:rounded-2xl md:border md:border-brand-100/90 md:bg-brand-50/40 md:p-1"
          aria-label={t("nav.mainNav")}
        >
          {navItems.map(({ href, label }) => {
            const active = navActive(pathname, href);
            return (
              <Link
                key={href}
                href={href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150",
                  active
                    ? "bg-white text-brand-800 shadow-sm ring-1 ring-brand-200/70"
                    : "text-brand-700 hover:bg-white/90 md:hover:bg-white/80"
                )}
              >
                {label}
              </Link>
            );
          })}
          {user && (
            <Link
              href="/dashboards"
              aria-current={navActive(pathname, "/dashboards") ? "page" : undefined}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-xl px-3 py-2 text-xs font-semibold transition-colors duration-150",
                navActive(pathname, "/dashboards")
                  ? "bg-white text-brand-800 shadow-sm ring-1 ring-brand-200/70"
                  : "text-brand-700 hover:bg-white/90 md:hover:bg-white/80"
              )}
            >
              {t("nav.dashboards")}
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
