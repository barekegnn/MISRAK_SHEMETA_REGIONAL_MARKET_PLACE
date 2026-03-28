"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Phone, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import { addToCart } from "@/app/actions/cart";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { DeliveryZone, ShopCity } from "@/types";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import Link from "next/link";

type P = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category: string;
  images: string[] | null;
  shops: {
    id: string;
    name: string;
    city: ShopCity;
    phone: string;
    description: string | null;
  } | null;
};

export function ProductDetailClient({
  product,
  deliveryZone,
}: {
  product: P;
  deliveryZone: DeliveryZone;
}) {
  const { t } = useLocale();
  const { user } = useAuth();
  const qc = useQueryClient();
  const imgs = product.images?.length ? product.images : ["/icons/icon-192.png"];
  const [idx, setIdx] = useState(0);
  const shop = product.shops;
  const price = Number(product.price);
  const fee = shop
    ? calculateDeliveryFee(shop.city, deliveryZone).fee
    : 0;

  async function add() {
    if (!user) {
      toast.message(t("cart.signInToCheckout"));
      return;
    }
    if (!shop) return;
    try {
      await addToCart({
        product_id: product.id,
        shop_id: shop.id,
        quantity: 1,
        price_at_add: price,
      });
      await qc.invalidateQueries({ queryKey: ["cart"] });
      toast.success(t("products.addToCart"));
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-3">
        <div className="relative aspect-square overflow-hidden rounded-3xl border border-brand-100 bg-brand-50 shadow-lg">
          <Image
            src={imgs[idx]}
            alt=""
            fill
            className="object-cover"
            priority
            unoptimized={imgs[idx].startsWith("http")}
          />
          {imgs.length > 1 && (
            <>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full"
                onClick={() => setIdx((i) => (i - 1 + imgs.length) % imgs.length)}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full"
                onClick={() => setIdx((i) => (i + 1) % imgs.length)}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </>
          )}
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {imgs.map((src, i) => (
            <button
              key={src + i}
              type="button"
              onClick={() => setIdx(i)}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 ${
                i === idx ? "border-brand-500" : "border-transparent"
              }`}
            >
              <Image src={src} alt="" fill className="object-cover" unoptimized={src.startsWith("http")} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-6">
        <div>
          <p className="text-sm font-medium text-accent-700">{product.category}</p>
          <h1 className="font-display text-3xl font-bold text-brand-950 md:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-2xl font-bold text-brand-800">{formatEtb(price)}</p>
        </div>
        <p className="whitespace-pre-wrap text-brand-800/90 leading-relaxed">
          {product.description}
        </p>
        <div className="rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
          <p className="text-sm font-semibold text-brand-900">
            {t("productDetail.deliveryFee")}
          </p>
          <p className="text-lg font-bold text-brand-700">{formatEtb(fee)}</p>
        </div>
        <Button size="lg" className="w-full rounded-2xl sm:w-auto" onClick={() => void add()}>
          <ShoppingCart className="h-5 w-5" />
          {t("products.addToCart")}
        </Button>
        {shop && (
          <div className="rounded-2xl border border-brand-100 bg-gradient-to-br from-brand-50/80 to-white p-5 shadow-sm">
            <h2 className="font-semibold text-brand-950">{t("productDetail.shopInfo")}</h2>
            <p className="mt-1 text-brand-800">{shop.name}</p>
            <p className="text-sm text-brand-600">{shop.city}</p>
            <a
              href={`tel:${shop.phone.replace(/\s/g, "")}`}
              className="mt-3 inline-flex items-center gap-2 font-medium text-accent-700"
            >
              <Phone className="h-4 w-4" />
              {t("productDetail.callShop")}: {shop.phone}
            </a>
            {shop.description && (
              <p className="mt-2 text-sm text-brand-700">{shop.description}</p>
            )}
            <Button asChild variant="secondary" className="mt-4 rounded-xl">
              <Link href="/products">{t("nav.browse")}</Link>
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
