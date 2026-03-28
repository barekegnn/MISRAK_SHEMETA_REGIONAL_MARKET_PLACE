"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatEtb } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { addToCart } from "@/app/actions/cart";
import { useAuth } from "@/components/providers/auth-provider";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import type { ShopCity } from "@/types";
import {
  categoryFallbackImage,
  genericListingImage,
  resolveProductCardImage,
} from "@/lib/product-images";

export type ProductCardData = {
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
    is_active?: boolean;
  } | null;
};

export function ProductCard({
  product,
  index,
  showShopLine = true,
}: {
  product: ProductCardData;
  index: number;
  /** When false, hides shop name line (e.g. on shop shelf page). */
  showShopLine?: boolean;
}) {
  const { t } = useLocale();
  const { user } = useAuth();
  const qc = useQueryClient();
  const shop = product.shops;
  const price = Number(product.price);
  const [imgSrc, setImgSrc] = useState(() =>
    resolveProductCardImage(product.images, product.category)
  );
  const fallbackStep = useRef(0);

  const imagesKey = product.images?.join("|") ?? "";

  useEffect(() => {
    fallbackStep.current = 0;
    setImgSrc(resolveProductCardImage(product.images, product.category));
  }, [product.id, product.category, imagesKey]);

  function onImgError() {
    if (fallbackStep.current === 0) {
      fallbackStep.current = 1;
      setImgSrc(categoryFallbackImage(product.category));
      return;
    }
    setImgSrc(genericListingImage());
  }

  async function add() {
    if (!user) {
      toast.message(t("cart.signInToCheckout"));
      return;
    }
    try {
      await addToCart({
        product_id: product.id,
        shop_id: shop?.id ?? "",
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
    >
      <Card className="group flex h-full flex-col overflow-hidden border-brand-100 shadow-md transition-shadow hover:shadow-xl">
        <Link href={`/products/${product.id}`} className="relative block aspect-[4/3] overflow-hidden bg-brand-50">
          <Image
            src={imgSrc}
            alt={product.name}
            fill
            className="object-cover transition duration-500 group-hover:scale-105"
            sizes="(max-width:768px) 50vw, 33vw"
            unoptimized={imgSrc.startsWith("http")}
            onError={onImgError}
          />
          <div className="absolute left-2 top-2 flex gap-1">
            <Badge variant="secondary" className="backdrop-blur-sm">
              {product.category}
            </Badge>
            {product.stock <= 3 ? (
              <Badge variant="accent">{t("products.lowStock")}</Badge>
            ) : (
              <Badge variant="success">{t("products.inStock")}</Badge>
            )}
          </div>
        </Link>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <div>
            <Link href={`/products/${product.id}`}>
              <h3 className="font-semibold text-brand-950 line-clamp-2 hover:text-brand-600">
                {product.name}
              </h3>
            </Link>
            {showShopLine && (
              <p className="text-xs text-brand-600">
                {shop?.name} · {shop?.city}
              </p>
            )}
          </div>
          <p className="line-clamp-2 text-sm text-brand-700/90">{product.description}</p>
          <div className="mt-auto flex items-center justify-between gap-2">
            <span className="font-display text-lg font-bold text-brand-900">
              {formatEtb(price)}
            </span>
            <Button size="sm" className="gap-1 rounded-xl" onClick={() => void add()}>
              <ShoppingCart className="h-4 w-4" />
              {t("products.addToCart")}
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
