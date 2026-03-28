import { LinkButton } from "@/components/ui/link-button";
import { StatsBanner } from "@/components/layout/StatsBanner";
import {
  getMockProducts,
  getMockShops,
  getShopProductCount,
  getShopsGroupedByCategory,
} from "@/lib/mock/catalog";
import { ShopCategorySection } from "@/components/shops/ShopCategorySection";
import { Card, CardContent } from "@/components/ui/card";
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
    <main>
      <section className="border-b border-neutral-200 bg-gradient-to-br from-indigo-50 to-amber-50">
        <div className="mx-auto flex max-w-[1440px] flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:px-6">
          <div className="flex-1 space-y-4">
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4F46E5]">
              🌅 Misrak Shemeta
            </p>
            <h1 className="text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
              Browse shops by category and city across Eastern Ethiopia
            </h1>
            <p className="max-w-xl text-neutral-600">
              Discover trusted shops first, then open any shop to see the
              products it offers. Payments stay protected with escrow and OTP
              delivery confirmation.
            </p>
            <div className="flex flex-wrap gap-3">
              <LinkButton
                href="/products"
                className="bg-[#4F46E5] hover:bg-[#4338CA]"
              >
                Shop now
              </LinkButton>
              <LinkButton href="/demo" variant="outline">
                Hackathon demo
              </LinkButton>
            </div>
          </div>
          <div className="grid flex-1 grid-cols-2 gap-3 md:max-w-md">
            <Card className="border-amber-200 bg-white/80 shadow-sm">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-amber-800">Escrow protected</p>
                <p className="mt-1 text-neutral-600">
                  Funds release only after you confirm delivery.
                </p>
              </CardContent>
            </Card>
            <Card className="border-indigo-200 bg-white/80 shadow-sm">
              <CardContent className="p-4 text-sm">
                <p className="font-semibold text-indigo-800">AI shopping help</p>
                <p className="mt-1 text-neutral-600">
                  Ask in Amharic, Afaan Oromo, or English.
                </p>
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
              Showing shops in{" "}
              <span className="font-semibold text-[#1E1B4B]">
                {selectedCity ? selectedCity.replace("_", " ") : "all cities"}
              </span>
            </p>
            {selectedCity ? (
              <LinkButton href="/" variant="outline" size="sm">
                Clear city filter
              </LinkButton>
            ) : null}
          </div>
        </div>

        {shopSections.length ? (
          shopSections.map((section) => (
            <ShopCategorySection
              key={section.category}
              title={section.category}
              shops={section.shops}
            />
          ))
        ) : (
          <div className="mx-auto max-w-[1440px] px-4 md:px-6">
            <Card className="border-dashed border-neutral-300 bg-white">
              <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
                <div>
                  <h2 className="text-xl font-semibold text-[#1E1B4B]">
                    No shops found for this city
                  </h2>
                  <p className="mt-2 max-w-lg text-sm text-neutral-600">
                    Try another city from the top filter bar or clear the filter
                    to browse all shops.
                  </p>
                </div>
                <LinkButton href="/" className="bg-[#4F46E5] hover:bg-[#4338CA]">
                  Browse all shops
                </LinkButton>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
