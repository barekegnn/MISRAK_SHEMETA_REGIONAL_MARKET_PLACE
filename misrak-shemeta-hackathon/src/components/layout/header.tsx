"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Home, ShoppingCart } from "lucide-react";
import { useAuth } from "@/components/providers/auth-provider";
import { LanguageSwitcher } from "@/components/layout/language-switcher";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { getCart } from "@/app/actions/cart";
import { useLocale } from "@/components/providers/locale-provider";

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { t } = useLocale();
  const { data: cart = [] } = useQuery({
   queryKey: ["cart", user?.id],
    queryFn: () => getCart(),
    enabled: !!user,
    staleTime: 30_000,
  });
  const n = cart.reduce((acc, i) => acc + i.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-brand-100/80 bg-white/85 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
        <Link
          href="/"
          className="flex items-center gap-2 font-display text-lg font-bold tracking-tight text-brand-900"
        >
          <span className="text-2xl" aria-hidden>
            🌅
          </span>
          <span className="hidden sm:inline">Misrak Shemeta</span>
        </Link>

        <div className="flex flex-1 items-center justify-end gap-2 sm:gap-3">
          <LanguageSwitcher className="scale-90 sm:scale-100" />

          <Link href="/cart" className="relative">
            <Button variant="secondary" size="icon" aria-label={t("nav.cart")}>
              <ShoppingCart className="h-5 w-5" />
              {n > 0 && (
                <Badge className="absolute -right-1 -top-1 h-5 min-w-5 rounded-full px-1 text-[10px]">
                  {n > 99 ? "99+" : n}
                </Badge>
              )}
            </Button>
          </Link>

          {user ? (
            <div className="flex items-center gap-2">
              <Link href="/profile">
                <Avatar className="h-9 w-9 cursor-pointer">
                  <AvatarFallback>
                    {(profile?.full_name?.[0] || user.email?.[0] || "?").toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </Link>
              <Button variant="ghost" size="sm" className="hidden sm:inline-flex" onClick={() => signOut()}>
                {t("common.signOut")}
              </Button>
            </div>
          ) : (
            <Button asChild size="sm">
              <Link href="/auth">{t("auth.signIn")}</Link>
            </Button>
          )}

          <Link href="/" className="hidden sm:block">
            <Button variant="ghost" size="icon" aria-label={t("nav.home")}>
              <Home className="h-5 w-5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
