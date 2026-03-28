"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, MapPin, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import type { ShopCity } from "@/types";
import type { PublicShopListRow } from "@/app/actions/catalog";

export function ShopCard({
  shop,
  index,
}: {
  shop: PublicShopListRow;
  index: number;
}) {
  const { t } = useLocale();
  const city = shop.city as ShopCity;
  const cityLabel = t(`shops.hub.${city}` as "shops.hub.Harar");

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, type: "spring", stiffness: 380, damping: 28 }}
    >
      <Card className="group flex h-full flex-col overflow-hidden border-brand-100/90 bg-gradient-to-b from-white to-brand-50/30 shadow-md transition-all duration-300 hover:border-brand-200 hover:shadow-xl">
        <div className="relative border-b border-brand-100/80 bg-gradient-to-br from-brand-500/10 via-accent-500/10 to-transparent px-5 py-6">
          <div className="flex items-start justify-between gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-brand-100">
              <Store className="h-6 w-6 text-brand-600" aria-hidden />
            </div>
            <Badge variant="secondary" className="shrink-0 gap-1 font-normal backdrop-blur-sm">
              <MapPin className="h-3 w-3" aria-hidden />
              {cityLabel}
            </Badge>
          </div>
          <h2 className="mt-4 font-display text-lg font-bold leading-snug text-brand-950 md:text-xl">
            {shop.name}
          </h2>
        </div>
        <div className="flex flex-1 flex-col gap-3 p-5">
          <p className="line-clamp-3 text-sm leading-relaxed text-brand-800/90">
            {shop.description || t("shops.noDescription")}
          </p>
          <p className="text-xs text-brand-500">{shop.phone}</p>
          <div className="mt-auto pt-1">
            <Button asChild className="w-full gap-2 rounded-2xl shadow-sm" size="lg">
              <Link href={`/shops/${shop.id}`}>
                {t("shops.enterShop")}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
