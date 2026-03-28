"use client";

import Image from "next/image";
import Link from "next/link";
import type { Product } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useI18n } from "@/lib/i18n/context";
import { useCart } from "@/lib/cart/context";
import { motion } from "framer-motion";
import { toast } from "sonner";

type Props = { product: Product; index?: number };

export function ProductCard({ product, index = 0 }: Props) {
  const { t } = useI18n();
  const { addItem } = useCart();
  const shop = product.shop;
  const img = product.images[0];
  const low = product.stock > 0 && product.stock <= 5;
  const out = product.stock === 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04 }}
      className="flex flex-col overflow-hidden rounded-lg border border-neutral-200 bg-white shadow-sm"
    >
      <Link href={`/products/${product.id}`} className="relative aspect-square bg-neutral-100">
        {img ? (
          <Image
            src={img}
            alt={product.name}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 50vw, 25vw"
          />
        ) : null}
        {out ? (
          <Badge variant="destructive" className="absolute left-2 top-2">
            Out of Stock
          </Badge>
        ) : low ? (
          <Badge className="absolute left-2 top-2 bg-amber-500 text-neutral-900 hover:bg-amber-500">
            Low Stock
          </Badge>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/products/${product.id}`}>
          <h3 className="line-clamp-2 min-h-[2.5rem] text-sm font-medium leading-snug text-neutral-900 hover:text-[#4F46E5]">
            {product.name}
          </h3>
        </Link>
        <p className="mt-1 text-lg font-bold text-[#4F46E5]">
          {product.price.toLocaleString()} <span className="text-sm font-normal">ETB</span>
        </p>
        <p className="mt-0.5 truncate text-xs text-neutral-500">
          {shop?.name} · {shop?.city.replace("_", " ")}
        </p>
        <Button
          className="mt-auto w-full bg-[#4F46E5] hover:bg-[#4338CA]"
          disabled={out}
          onClick={() => {
            addItem(product, 1);
            toast.success("Added to cart");
          }}
        >
          {t("addToCart")}
        </Button>
      </div>
    </motion.article>
  );
}
