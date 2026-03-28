import Link from "next/link";
import { notFound } from "next/navigation";
import { MapPin, Phone, Store } from "lucide-react";
import { ProductCard } from "@/components/products/ProductCard";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";
import {
  getMockShopById,
  getProductsByShopId,
} from "@/lib/mock/catalog";

type ShopPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function ShopPage({ params }: ShopPageProps) {
  const { id } = await params;
  const shop = getMockShopById(id);

  if (!shop) {
    notFound();
  }

  const products = getProductsByShopId(shop.id);

  return (
    <main className="mx-auto max-w-[1440px] px-4 py-8 md:px-6">
      <div className="mb-6">
        <Link
          href="/"
          className="text-sm font-medium text-[#4F46E5] hover:underline"
        >
          ← Back to home
        </Link>
      </div>

      <Card className="border-neutral-200 bg-white shadow-sm">
        <CardContent className="space-y-5 p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1 text-sm font-medium text-[#4F46E5]">
                <Store className="size-4" />
                {shop.category}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-[#1E1B4B]">
                  {shop.name}
                </h1>
                <p className="mt-2 flex items-center gap-2 text-sm text-neutral-600">
                  <MapPin className="size-4" />
                  {shop.city.replace("_", " ")}
                </p>
              </div>
            </div>

            <a
              href={`tel:${shop.phone}`}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Phone className="size-4" />
              {shop.phone}
            </a>
          </div>

          <p className="max-w-3xl text-sm leading-relaxed text-neutral-600">
            {shop.description}
          </p>

          <div className="flex flex-wrap items-center gap-3 text-sm text-neutral-500">
            <span className="rounded-full bg-neutral-100 px-3 py-1 font-medium text-neutral-700">
              {products.length} {products.length === 1 ? "product" : "products"}
            </span>
            <span>
              Shop city: <strong>{shop.city.replace("_", " ")}</strong>
            </span>
          </div>
        </CardContent>
      </Card>

      <section className="mt-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-[#4F46E5]">
              Shop Products
            </p>
            <h2 className="text-2xl font-bold text-[#1E1B4B]">
              Products available in {shop.name}
            </h2>
          </div>
          <LinkButton href="/products" variant="outline">
            Browse all products
          </LinkButton>
        </div>

        {products.length ? (
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 xl:grid-cols-4">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                index={index}
              />
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-neutral-300 bg-white">
            <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
              <div>
                <h3 className="text-lg font-semibold text-[#1E1B4B]">
                  No products available yet
                </h3>
                <p className="mt-2 max-w-md text-sm text-neutral-600">
                  This shop is listed, but its products have not been added
                  yet.
                </p>
              </div>
              <LinkButton href="/products" className="bg-[#4F46E5]">
                Explore other products
              </LinkButton>
            </CardContent>
          </Card>
        )}
      </section>
    </main>
  );
}
