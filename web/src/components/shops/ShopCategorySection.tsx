import type { Shop } from "@/types";
import { ShopCard } from "@/components/shops/ShopCard";

type ShopCategorySectionProps = {
  title: string;
  shops: Array<{
    shop: Shop;
    productCount: number;
  }>;
};

export function ShopCategorySection({
  title,
  shops,
}: ShopCategorySectionProps) {
  if (!shops.length) {
    return null;
  }

  return (
    <section className="mx-auto max-w-[1440px] px-4 md:px-6">
      <div className="mb-4 flex items-end justify-between gap-3">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-[#4F46E5]">
            Shop Category
          </p>
          <h2 className="text-2xl font-bold text-[#1E1B4B]">{title}</h2>
        </div>
        <p className="text-sm text-neutral-500">
          {shops.length} {shops.length === 1 ? "shop" : "shops"}
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
