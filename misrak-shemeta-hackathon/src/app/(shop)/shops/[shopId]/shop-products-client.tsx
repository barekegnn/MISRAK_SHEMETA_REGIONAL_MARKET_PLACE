"use client";

import { useQuery } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { getPublicProducts } from "@/app/actions/catalog";
import { ProductCard, type ProductCardData } from "@/components/products/product-card";
import { BrowseTrail } from "@/components/navigation/browse-trail";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/providers/locale-provider";
import type { ShopCity } from "@/types";

export function ShopProductsClient({
  shop,
}: {
  shop: {
    id: string;
    name: string;
    city: ShopCity;
    phone: string;
    description: string | null;
  };
}) {
  const { t } = useLocale();
  const cityLabel = t(`shops.hub.${shop.city}` as "shops.hub.Harar");

  const { data, isPending } = useQuery({
    queryKey: ["shop-products", shop.id],
    queryFn: () => getPublicProducts({ shopId: shop.id }),
    staleTime: 60_000,
  });

  const list = (data ?? []) as unknown as ProductCardData[];

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <Button
          variant="ghost"
          size="sm"
          asChild
          className="w-fit gap-1 rounded-xl text-brand-700 hover:bg-brand-50"
        >
          <Link href="/shops">
            <ChevronLeft className="h-4 w-4" />
            {t("shops.backToShops")}
          </Link>
        </Button>
        <BrowseTrail
          variant="premium"
          className="order-first w-full md:order-none md:max-w-3xl"
          items={[
            { href: "/", label: t("nav.home") },
            { href: "/shops", label: t("shops.browseTitle") },
            { label: shop.name, current: true },
          ]}
        />
      </div>

      <header className="rounded-3xl border border-brand-100 bg-gradient-to-br from-white via-brand-50/40 to-accent-500/10 p-6 shadow-md md:p-8">
        <p className="text-xs font-semibold uppercase tracking-wide text-brand-600">
          {cityLabel}
        </p>
        <h1 className="mt-2 font-display text-3xl font-bold text-brand-950 md:text-4xl">
          {shop.name}
        </h1>
        {shop.description && (
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-brand-800 md:text-base">
            {shop.description}
          </p>
        )}
        <p className="mt-3 text-sm text-brand-600">{shop.phone}</p>
      </header>

      <section aria-labelledby="shop-products-heading">
        <h2 id="shop-products-heading" className="mb-4 font-display text-xl font-bold text-brand-900">
          {t("shops.productsInShop")}
        </h2>
        {isPending ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[380px] rounded-2xl" />
            ))}
          </div>
        ) : list.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-brand-200 bg-brand-50/50 py-12 text-center text-brand-700">
            {t("shops.noProductsYet")}
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} showShopLine={false} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
