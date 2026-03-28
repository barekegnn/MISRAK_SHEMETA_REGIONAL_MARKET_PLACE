import {
  getMockProducts,
  getMockShops,
  getShopProductCount,
  getShopsGroupedByCategory,
} from "@/lib/mock/catalog";
import { HomePageClient } from "@/app/home-client";
import type { ShopCity } from "@/types";

type HomePageProps = {
  searchParams: Promise<{
    city?: string;
  }>;
};

function normalizeCityFilter(value?: string): ShopCity | null {
  if (value === "Harar") return "Harar";
  if (value === "Dire_Dawa") return "Dire_Dawa";
  if (value === "Haramaya") return "Haramaya";
  if (value === "Jijiga") return "Jijiga";
  return null;
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { city } = await searchParams;
  const selectedCity = normalizeCityFilter(city);
  const stats = {
    products: getMockProducts().length,
    shops: getMockShops().length,
    buyers: 128,
  };
  const shopSections = getShopsGroupedByCategory()
    .map((section) => ({
      ...section,
      shops: section.shops
        .filter((shop) => !selectedCity || shop.city === selectedCity)
        .map((shop) => ({
          shop,
          productCount: getShopProductCount(shop.id),
        })),
    }))
    .filter((section) => section.shops.length > 0);

  return (
    <HomePageClient
      selectedCity={selectedCity}
      shopSections={shopSections}
      stats={stats}
    />
  );
}
