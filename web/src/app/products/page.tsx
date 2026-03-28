import { Suspense } from "react";
import { ProductCard } from "@/components/products/ProductCard";
import { CatalogSidebar } from "@/components/products/CatalogSidebar";
import { EmptyStateCard } from "@/components/dashboard/dashboard-ui";
import { getFilteredProducts } from "@/lib/data/marketplace";
import type { ShopCity } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

type SearchParams = Promise<{
  q?: string;
  category?: string;
  city?: string;
  minPrice?: string;
  maxPrice?: string;
}>;

async function ProductGrid({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const list = await getFilteredProducts({
    q: sp.q,
    category: sp.category,
    city: sp.city as ShopCity | undefined,
    minPrice: sp.minPrice ? Number(sp.minPrice) : undefined,
    maxPrice: sp.maxPrice ? Number(sp.maxPrice) : undefined,
  });

  if (!list.length) {
    return (
      <EmptyStateCard
        title="No products match these filters"
        description="Try clearing a filter, broadening your search keywords, or publishing more active catalog items."
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {list.map((p, i) => (
        <ProductCard key={p.id} product={p} index={i} />
      ))}
    </div>
  );
}

export default function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  return (
    <main className="mx-auto max-w-[1440px] px-3 py-6 md:px-6">
      <div className="flex flex-col gap-6 lg:flex-row lg:gap-8">
        <aside className="hidden w-56 shrink-0 lg:block">
          <Suspense fallback={<Skeleton className="h-96 w-full" />}>
            <CatalogSidebar />
          </Suspense>
        </aside>
        <div className="min-w-0 flex-1">
          <div className="mb-4 lg:hidden">
            <Suspense fallback={<Skeleton className="h-64 w-full" />}>
              <CatalogSidebar />
            </Suspense>
          </div>
          <Suspense
            fallback={
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <Skeleton key={i} className="aspect-[3/4] rounded-lg" />
                ))}
              </div>
            }
          >
            <ProductGrid searchParams={searchParams} />
          </Suspense>
        </div>
      </div>
    </main>
  );
}
