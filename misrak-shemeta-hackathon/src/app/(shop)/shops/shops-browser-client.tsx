"use client";

import { useCallback, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { getPublicShops } from "@/app/actions/catalog";
import { ShopCard } from "@/components/shops/shop-card";
import { CityHubChips } from "@/components/shops/city-hub-chips";
import { BrowseTrail } from "@/components/navigation/browse-trail";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/providers/locale-provider";
import {
  hubParamToShopCity,
  type BrowseHubParam,
  isValidHubParam,
} from "@/lib/browse-hubs";

function readHub(param: string | null): BrowseHubParam {
  if (!param || param === "all") return "all";
  if (isValidHubParam(param)) return param;
  return "all";
}

export function ShopsBrowserClient() {
  const { t } = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const hub = readHub(searchParams.get("hub"));

  const cityFilter = useMemo(() => hubParamToShopCity(hub === "all" ? null : hub), [hub]);

  const setHub = useCallback(
    (next: BrowseHubParam) => {
      const q = new URLSearchParams(searchParams.toString());
      if (next === "all") q.delete("hub");
      else q.set("hub", next);
      const s = q.toString();
      router.push(s ? `${pathname}?${s}` : pathname, { scroll: false });
    },
    [pathname, router, searchParams]
  );

  const { data: shops = [], isPending } = useQuery({
    queryKey: ["public-shops", cityFilter],
    queryFn: () => getPublicShops({ city: cityFilter }),
    staleTime: 60_000,
  });

  const hubLabel =
    hub === "all"
      ? t("shops.hub.all")
      : t(`shops.hub.${hub}` as "shops.hub.Harar");

  return (
    <div className="space-y-8">
      <BrowseTrail
        variant="premium"
        className="hidden md:block"
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("shops.browseTitle"), current: true },
        ]}
      />

      <header className="space-y-4 border-b border-brand-100/80 pb-8">
        <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight text-brand-950 md:text-4xl">
              {t("shops.browseTitle")}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-brand-700 md:text-base">
              {t("shops.browseSubtitle")}
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wide text-brand-500 md:text-right">
            {t("shops.filterByArea")}:{" "}
            <span className="text-brand-800">{hubLabel}</span>
          </p>
        </div>

        <div className="rounded-2xl border border-brand-100 bg-white/80 p-4 shadow-sm backdrop-blur-sm">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-brand-600">
            {t("shops.areaChipsLabel")}
          </p>
          <CityHubChips active={hub} onSelect={setHub} />
        </div>
      </header>

      <BrowseTrail
        variant="standard"
        className="md:hidden"
        items={[
          { href: "/", label: t("nav.home") },
          { label: t("shops.browseTitle"), current: true },
        ]}
      />

      {isPending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-[320px] rounded-2xl" />
          ))}
        </div>
      ) : shops.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-brand-200 bg-brand-50/40 px-6 py-16 text-center">
          <p className="font-medium text-brand-800">{t("shops.emptyArea")}</p>
          <p className="mt-2 text-sm text-brand-600">{t("shops.emptyAreaHint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {shops.map((s, i) => (
            <ShopCard key={s.id} shop={s} index={i} />
          ))}
        </div>
      )}
    </div>
  );
}
