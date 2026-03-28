"use client";

import type { Product } from "@/types";
import { ProductCard } from "@/components/products/ProductCard";

type Props = { title: string; products: Product[] };

export function ProductCarousel({ title, products }: Props) {
  return (
    <section className="py-6">
      <div className="mx-auto max-w-[1440px] px-3 md:px-6">
        <h2 className="mb-3 text-lg font-bold text-[#1E1B4B]">{title}</h2>
        <div className="-mx-3 flex gap-3 overflow-x-auto px-3 pb-2 md:mx-0 md:px-0">
          {products.map((p, i) => (
            <div
              key={p.id}
              className="w-[44vw] max-w-[220px] shrink-0 sm:w-[200px]"
            >
              <ProductCard product={p} index={i} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
