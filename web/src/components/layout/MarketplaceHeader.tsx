"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, FormEvent } from "react";
import { ShoppingCart, Search, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import type { ProductCategory } from "@/types";
import { getDashboardRoute } from "@/lib/auth/shared";
import {
  translateProductCategory,
  translateRole,
} from "@/lib/i18n/labels";

export function MarketplaceHeader({
  initialQuery = "",
}: {
  initialQuery?: string;
}) {
  const { t } = useI18n();
  const { user, signOut } = useAuth();
  const { itemCount } = useCart();
  const router = useRouter();
  const [q, setQ] = useState(initialQuery);
  const [category, setCategory] = useState<ProductCategory | "All">("All");

  function onSearch(e: FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (q.trim()) params.set("q", q.trim());
    if (category !== "All") params.set("category", category);
    router.push(`/products?${params.toString()}`);
  }

  const firstName = user?.full_name?.split(" ")[0] ?? user?.email?.split("@")[0];
  const dashboardHref = user ? getDashboardRoute(user.role) : "/auth";
  const accountHref = user ? "/account" : "/auth";
  const ordersHref =
    user?.role === "seller"
      ? "/merchant/orders"
      : user?.role === "runner"
        ? "/runner"
        : user?.role === "admin"
          ? "/admin"
          : "/orders";

  return (
    <header className="border-b border-neutral-200 bg-white shadow-sm">
      <div className="mx-auto flex max-w-[1440px] flex-wrap items-center gap-3 px-3 py-3 md:gap-4 md:px-6">
        <Link
          href="/"
                  className="flex shrink-0 items-center gap-2 text-lg font-bold tracking-tight text-[#1E1B4B]"
        >
          <span aria-hidden>🌅</span>
          <span className="hidden sm:inline">{t("brand")}</span>
        </Link>

        <form
          onSubmit={onSearch}
                  className="order-last flex w-full min-w-0 flex-1 items-center gap-2 md:order-none md:max-w-2xl lg:max-w-3xl"
        >
          <DropdownMenu>
            <DropdownMenuTrigger className="hidden h-10 shrink-0 items-center justify-center rounded-l-lg rounded-r-none border border-input bg-background px-3 text-sm font-medium outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring md:inline-flex">
              {translateProductCategory(category, t)}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="max-h-72 overflow-y-auto">
              <DropdownMenuItem key="all" onClick={() => setCategory("All")}>
                {translateProductCategory("All", t)}
              </DropdownMenuItem>
              {PRODUCT_CATEGORIES.filter((c) => c !== "All").map((c) => (
                <DropdownMenuItem key={c} onClick={() => setCategory(c)}>
                  {translateProductCategory(c, t)}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex min-w-0 flex-1">
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("searchPlaceholder")}
              className="h-10 rounded-r-none border-neutral-300 focus-visible:z-10 md:rounded-l-none"
            />
            <Button
              type="submit"
              className="h-10 shrink-0 rounded-l-none bg-amber-500 px-4 text-neutral-900 hover:bg-amber-400"
            >
              <Search className="size-5" />
            </Button>
          </div>
        </form>

        <div className="ml-auto flex shrink-0 items-center gap-2 md:gap-3">
          <div className="hidden lg:block">
            <LanguageSwitcher variant="onLight" />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger className="flex h-auto flex-col items-start rounded-md px-2 py-1 text-xs leading-tight outline-none hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring">
              <span className="text-neutral-500">
                {user
                  ? t("helloUser", { name: String(firstName ?? "") })
                  : t("account")}
              </span>
              <span className="font-semibold text-[#1E1B4B]">
                {user ? translateRole(user.role, t) : t("signIn")}
              </span>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {user ? (
                <>
                  <DropdownMenuItem onClick={() => router.push(accountHref)}>
                    {t("account")}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push(dashboardHref)}>
                    {t("menu_dashboard")}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() =>
                      void (async () => {
                        await signOut();
                        router.push("/");
                        router.refresh();
                      })()
                    }
                  >
                    {t("signOut")}
                  </DropdownMenuItem>
                </>
              ) : (
                <DropdownMenuItem onClick={() => router.push("/auth")}>
                  {t("signIn")}
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>

          <Link href={ordersHref}>
            <Button variant="ghost" className="hidden flex-col gap-0 px-2 py-1 sm:flex">
              <Package className="size-5 text-[#1E1B4B]" />
              <span className="text-xs font-semibold">{t("orders")}</span>
            </Button>
          </Link>

          <Link href="/cart">
            <Button variant="ghost" className="relative flex flex-col gap-0 px-2 py-1">
              <ShoppingCart className="size-6 text-[#1E1B4B]" />
              <span className="text-xs font-semibold">{t("cart")}</span>
              {itemCount > 0 ? (
                <span className="absolute -right-0.5 -top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-500 px-1 text-[10px] font-bold text-neutral-900">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              ) : null}
            </Button>
          </Link>
        </div>
      </div>
    </header>
  );
}
