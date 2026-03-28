"use client";

import Image from "next/image";
import { useState } from "react";
import type { DeliveryZone, Product } from "@/types";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useI18n } from "@/lib/i18n/context";
import { useAuth } from "@/lib/auth/context";
import { isMarketplaceBuyer } from "@/lib/auth/shared";
import { useCart } from "@/lib/cart/context";
import { Phone, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";

type Props = {
  product: Product;
  deliveryZone: DeliveryZone;
};

export function ProductBuyBox({ product, deliveryZone }: Props) {
  const { t } = useI18n();
  const { user } = useAuth();
  const { addItem } = useCart();
  const canShop = isMarketplaceBuyer(user);
  const [qty, setQty] = useState(1);
  const shop = product.shop;
  const route = calculateDeliveryFee(shop?.city ?? "Harar", deliveryZone);
  const out = product.stock === 0;
  const low = product.stock > 0 && product.stock <= 5;

  return (
    <div className="rounded-lg border border-neutral-200 bg-white p-4 shadow-sm lg:sticky lg:top-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-2xl font-bold text-[#4F46E5]">
            {product.price.toLocaleString()}{" "}
            <span className="text-base font-normal">ETB</span>
          </p>
          {low ? (
            <Badge className="mt-1 bg-amber-500 text-neutral-900">Low Stock</Badge>
          ) : null}
          {out ? (
            <Badge variant="destructive" className="mt-1">
              Out of Stock
            </Badge>
          ) : null}
        </div>
        {product.images[0] ? (
          <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-neutral-100 md:hidden">
            <Image
              src={product.images[0]}
              alt=""
              fill
              className="object-cover"
              sizes="64px"
            />
          </div>
        ) : null}
      </div>

      <Separator className="my-3" />

      <p className="text-sm text-neutral-600">
        <span className="font-medium text-neutral-800">Delivery</span> to{" "}
        {deliveryZone.replace(/_/g, " ")}:{" "}
        <span className="font-semibold text-[#4F46E5]">
          {route.fee} ETB
        </span>{" "}
        · {route.estimatedTime}
      </p>

      <div className="mt-4 flex items-center gap-2">
        <span className="text-sm text-neutral-600">Qty</span>
        <div className="flex items-center rounded-md border border-neutral-200">
          <button
            type="button"
            className="px-3 py-1.5 text-lg leading-none"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="min-w-8 text-center text-sm font-medium">{qty}</span>
          <button
            type="button"
            className="px-3 py-1.5 text-lg leading-none"
            onClick={() =>
              setQty((q) => Math.min(product.stock || q, q + 1))
            }
            disabled={out}
          >
            +
          </button>
        </div>
      </div>

      <Button
        className="mt-4 w-full bg-amber-500 text-base font-semibold text-neutral-900 hover:bg-amber-400"
        disabled={out || !canShop}
        onClick={() => {
          addItem(product, qty);
          if (canShop) {
            toast.success(`${qty} added to cart`);
          }
        }}
      >
        {!user
          ? "Sign in to buy"
          : !canShop
            ? "Buyers only"
            : t("addToCart")}
      </Button>

      <a
        href={shop?.phone ? `tel:${shop.phone}` : "#"}
        className={cn(
          buttonVariants({ variant: "outline" }),
          "mt-2 inline-flex w-full",
        )}
      >
        <Phone className="mr-2 size-4" />
        {shop?.phone ?? "Seller contact unavailable"}
      </a>

      <ul className="mt-4 space-y-2 text-xs text-neutral-600">
        <li className="flex gap-2">
          <ShieldCheck className="size-4 shrink-0 text-emerald-600" />
          {t("shopWithConfidence")}
        </li>
      </ul>
    </div>
  );
}
