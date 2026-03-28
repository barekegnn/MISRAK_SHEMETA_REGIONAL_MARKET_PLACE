"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import type { Product } from "@/types";
import { useAuth } from "@/lib/auth/context";
import { ProductBuyBox } from "@/components/products/ProductBuyBox";
import { Card, CardContent } from "@/components/ui/card";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function ProductDetailView({ product }: { product: Product }) {
  const { deliveryZone } = useAuth();
  const images = product.images.length ? product.images : [""];
  const [idx, setIdx] = useState(0);
  const shop = product.shop;

  return (
    <div className="mx-auto max-w-[1440px] px-3 py-6 md:px-6">
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div>
          <div className="relative aspect-square max-h-[520px] overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100">
            {images[idx] ? (
              <Image
                src={images[idx]}
                alt={product.name}
                fill
                className="object-contain"
                priority
                sizes="(max-width: 1024px) 100vw, 60vw"
              />
            ) : null}
            {images.length > 1 ? (
              <>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute left-2 top-1/2 -translate-y-1/2"
                  onClick={() => setIdx((i) => (i - 1 + images.length) % images.length)}
                >
                  <ChevronLeft className="size-4" />
                </Button>
                <Button
                  type="button"
                  size="icon"
                  variant="secondary"
                  className="absolute right-2 top-1/2 -translate-y-1/2"
                  onClick={() => setIdx((i) => (i + 1) % images.length)}
                >
                  <ChevronRight className="size-4" />
                </Button>
              </>
            ) : null}
          </div>
          <div className="mt-6 space-y-4">
            <h1 className="text-2xl font-bold text-[#1E1B4B]">{product.name}</h1>
            <div>
              <h2 className="text-sm font-semibold text-neutral-800">
                About this item
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-neutral-600">
                {product.description}
              </p>
            </div>
            <Card className="border-neutral-200 transition-colors hover:border-indigo-200">
              <CardContent className="space-y-2 p-4 text-sm">
                {shop ? (
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold text-neutral-800">
                      Sold by{" "}
                      <Link
                        href={`/shops/${shop.id}`}
                        className="text-[#4F46E5] hover:underline"
                      >
                        {shop.name}
                      </Link>
                    </p>
                    <Link
                      href={`/shops/${shop.id}`}
                      className="text-xs font-medium text-[#4F46E5] hover:underline"
                    >
                      Visit shop
                    </Link>
                  </div>
                ) : (
                  <p className="font-semibold text-neutral-800">
                    Sold by Verified merchant
                  </p>
                )}
                <p className="text-neutral-600">
                  {shop?.description ?? "Store details will appear when the seller profile is complete."}
                </p>
                <p className="text-neutral-600">📍 {shop?.city?.replace("_", " ") ?? "Eastern Ethiopia"}</p>
              </CardContent>
            </Card>
          </div>
        </div>
        <div>
          <ProductBuyBox product={product} deliveryZone={deliveryZone} />
        </div>
      </div>
    </div>
  );
}
