"use client";

import { LinkButton } from "@/components/ui/link-button";
import { StatsBanner } from "@/components/layout/StatsBanner";
import { ShopCategorySection } from "@/components/shops/ShopCategorySection";
import { Card, CardContent } from "@/components/ui/card";
import { useI18n } from "@/lib/i18n/context";
import { translateShopCity } from "@/lib/i18n/labels";
import type { Shop, ShopCategory, ShopCity } from "@/types";

export type HomeShopSection = {
  category: ShopCategory;
  shops: Array<{ shop: Shop; productCount: number }>;
};

export function HomePageClient({
  selectedCity,
  shopSections,
  stats,
}: {
  selectedCity: ShopCity | null;
  shopSections: HomeShopSection[];
  stats: { products: number; shops: number; buyers: number };
}) {
  const { t } = useI18n();
  const cityLabel = selectedCity
    ? translateShopCity(selectedCity, t)
    : t("home_allCities");

  return (
    <main>
      <section className="border-b border-neutral-200 bg-gradient-to-br from-indigo-50 to-amber-50">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:px-6">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4F46E5]">
              {t("home_eyebrow")}
            </p>
            <h1 className="text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
              {t("home_title")}
            </h1>
            <p className="max-w-xl text-neutral-600">{t("home_subtitle")}</p>
            <div className="flex flex-wrap gap-3">
              <LinkButton
                href="/products"
                className="bg-[#4F46E5] hover:bg-[#4338CA]"
              >
                {t("home_shopNow")}
              </LinkButton>
              <LinkButton href="/demo" variant="outline">
                {t("home_demo")}
              </LinkButton>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 md:max-w-md">
            <Card className="border-amber-200 bg-white/80 shadow-sm">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-amber-800">
                  {t("home_escrowTitle")}
                </p>
                <p className="mt-1 text-neutral-600">{t("home_escrowBody")}</p>
              </CardContent>
            </Card>
            <Card className="border-indigo-200 bg-white/80 shadow-sm">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-indigo-800">
                  {t("home_aiTitle")}
                </p>
                <p className="mt-1 text-neutral-600">{t("home_aiBody")}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <StatsBanner stats={stats} />

      <div className="space-y-8 py-8">
        <div className="mx-auto max-w-[1440px] px-4 md:px-6">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-sm">
            <p className="text-neutral-700">
              {t("home_showingShopsIn")}{" "}
              <span className="font-semibold text-[#1E1B4B]">{cityLabel}</span>
            </p>
            {selectedCity ? (
              <LinkButton href="/" variant="outline" size="sm">
                {t("home_clearCityFilter")}
              </LinkButton>
            ) : null}
          </div>
        </div>

        {shopSections.length ? (
          shopSections.map((section) => (
            <ShopCategorySection
              key={section.category}
              category={section.category}
              shops={section.shops}
            />
          ))
        ) : (
          <div className="mx-auto max-w-[1440px] px-4 md:px-6">
            <Card className="border-dashed border-neutral-300 bg-white">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div>
                  <h2 className="text-xl font-semibold text-[#1E1B4B]">
                    {t("home_noShopsTitle")}
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-neutral-600">
                    {t("home_noShopsBody")}
                  </p>
                </div>
                <LinkButton
                  href="/"
                  className="bg-[#4F46E5] hover:bg-[#4338CA]"
                >
                  {t("home_browseAllShops")}
                </LinkButton>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
