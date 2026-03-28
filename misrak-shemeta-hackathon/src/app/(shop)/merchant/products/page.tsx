"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { getProductsByShop } from "@/app/actions/products";
import { ProductForm, ProductRow } from "@/components/merchant/product-form";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function MerchantProductsPage() {
  const qc = useQueryClient();
  const { data: products = [], isPending } = useQuery({
    queryKey: ["merchant-products"],
    queryFn: () => getProductsByShop(),
  });

  if (isPending) return <p>Loading…</p>;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-bold">Products</h1>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/merchant">Dashboard</Link>
        </Button>
      </div>
      <ProductForm onDone={() => void qc.invalidateQueries({ queryKey: ["merchant-products"] })} />
      <ul className="space-y-2">
        {products.map((p) => (
          <li key={p.id as string}>
            <ProductRow
              id={p.id as string}
              name={p.name as string}
              onRemoved={() => void qc.invalidateQueries({ queryKey: ["merchant-products"] })}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
