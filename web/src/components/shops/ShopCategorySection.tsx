"use client";

import type { Shop, ShopCategory } from "@/types";
import { ShopCard } from "@/components/shops/ShopCard";
import { useI18n } from "@/lib/i18n/context";
import { translateShopCategory } from "@/lib/i18n/labels";

type ShopCategorySectionProps = {
  category: ShopCategory;
  shops: Array<{
    shop: Shop;
    productCount: number;
  }>;
};

export function ShopCategorySection({
  category,
  shops,
}: ShopCategorySectionProps) {
  const { t } = useI18n();
  const title = translateShopCategory(category, t);

  if (!shops.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4F46E5]">
            {t("shopCategory_label")}
          </p>
          <h2 className="text-2xl font-bold text-[#1E1B4B]">{title}</h2>
        </div>
        <p className="text-sm text-neutral-500">
          {shops.length}{" "}
          {shops.length === 1 ? t("word_shop") : t("word_shops")}
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {shops.map(({ shop, productCount }) => (
          <ShopCard
            key={shop.id}
            shop={shop}
            productCount={productCount}
          />
        ))}
      </div>
    </section>
  );
}
