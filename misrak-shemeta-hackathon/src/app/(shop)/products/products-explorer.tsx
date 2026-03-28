"use client";

import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { getPublicProducts } from "@/app/actions/catalog";
import { ProductCard, type ProductCardData } from "@/components/products/product-card";
import {
  FilterPanel,
  type ProductFilters,
} from "@/components/products/filter-panel";
import { Skeleton } from "@/components/ui/skeleton";
import { useLocale } from "@/components/providers/locale-provider";

export function ProductsExplorer() {
  const { t } = useLocale();
  const [filters, setFilters] = useState<ProductFilters>({
    q: "",
    category: "all",
    city: "all",
    min: null,
    max: null,
  });

  const [debouncedQ, setDebouncedQ] = useState(filters.q);
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(filters.q), 300);
    return () => clearTimeout(id);
  }, [filters.q]);

  const queryFilters = useMemo(
    () => ({
      q: debouncedQ || undefined,
      category: filters.category,
      city: filters.city,
      min: filters.min ?? undefined,
      max: filters.max ?? undefined,
    }),
    [debouncedQ, filters.category, filters.city, filters.min, filters.max]
  );

  const { data, isPending } = useQuery({
    queryKey: ["products", queryFilters],
    queryFn: () => getPublicProducts(queryFilters),
    staleTime: 60_000,
  });

  const list = (data ?? []) as unknown as ProductCardData[];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">
          {t("products.title")}
        </h1>
      </div>
      <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
        <FilterPanel value={filters} onChange={setFilters} />
        <div>
          {isPending ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-[380px] rounded-2xl" />
              ))}
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
