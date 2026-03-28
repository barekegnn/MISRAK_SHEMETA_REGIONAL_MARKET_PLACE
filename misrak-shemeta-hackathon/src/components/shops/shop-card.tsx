"use client";

import { useState, type CSSProperties } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, MapPin, Package, Sparkles, Store } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import type { ShopCity } from "@/types";
import type { PublicShopListRow } from "@/app/actions/catalog";
import { cn } from "@/lib/utils";

const CITY_HERO: Record<ShopCity, { gradient: string; glow: string }> = {
  Harar: {
    gradient:
      "from-emerald-700/95 via-teal-800/90 to-[#0c1f1a]",
    glow: "shadow-emerald-500/25",
  },
  Aweday: {
    gradient: "from-lime-700/95 via-green-800/92 to-[#142818]",
    glow: "shadow-lime-500/20",
  },
  Dire_Dawa: {
    gradient: "from-slate-600/95 via-indigo-900/90 to-brand-950",
    glow: "shadow-indigo-400/20",
  },
  Jigjiga: {
    gradient: "from-amber-800/95 via-rose-900/88 to-[#1a0a0c]",
    glow: "shadow-amber-400/15",
  },
  Haramaya: {
    gradient: "from-violet-700/92 via-brand-800/90 to-brand-950",
    glow: "shadow-violet-400/20",
  },
  Jijiga: {
    gradient: "from-orange-700/95 via-red-900/88 to-brand-950",
    glow: "shadow-orange-400/18",
  },
};

function PreviewThumb({
  src,
  alt,
  style,
}: {
  src: string;
  alt: string;
  style?: CSSProperties;
}) {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;
  return (
    <div
      className="relative h-[4.5rem] w-[4.5rem] shrink-0 overflow-hidden rounded-2xl ring-2 ring-white/95 shadow-lg backdrop-blur-sm"
      style={style}
    >
      <Image
        src={src}
        alt={alt}
        fill
        className="object-cover transition duration-500 ease-out group-hover/card:scale-110"
        sizes="72px"
        unoptimized={src.startsWith("http")}
        onError={() => setVisible(false)}
      />
    </div>
  );
}

export function ShopCard({
  shop,
  index,
}: {
  shop: PublicShopListRow;
  index: number;
}) {
  const { t } = useLocale();
  const reduceMotion = useReducedMotion();
  const city = shop.city as ShopCity;
  const cityLabel = t(`shops.hub.${city}` as "shops.hub.Harar");
  const hero = CITY_HERO[city] ?? CITY_HERO.Harar;
  const previews = shop.previewImages.slice(0, 3);
  const listed =
    shop.productCount > 0
      ? `${shop.productCount}\u00A0${t("products.productsCount")}`
      : t("shops.noListingsYet");

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 16 }}
      animate={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={
        reduceMotion
          ? undefined
          : { delay: index * 0.06, type: "spring", stiffness: 420, damping: 30 }
      }
      className="h-full"
    >
      <Card
        className={cn(
          "group/card flex h-full flex-col overflow-hidden rounded-[1.35rem] border border-white/60 bg-white/85 shadow-md backdrop-blur-md transition-all duration-500 ease-out",
          "hover:-translate-y-1 hover:border-brand-200/90 hover:shadow-2xl",
          hero.glow
        )}
      >
        <div
          className={cn(
            "relative isolate min-h-[11.5rem] overflow-hidden bg-gradient-to-br px-5 pb-5 pt-6 text-white",
            hero.gradient
          )}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-[0.22]"
            style={{
              backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='49' viewBox='0 0 28 49'%3E%3Cg fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.35'%3E%3Cpath d='M13.99 9.25l13 7.5v15l-13 7.5L1 31.75v-15l12.99-7.5zM3 17.9v12.7l10.99 6.34 11-6.35V17.9l-11-6.34L3 17.9zM0 15l12.98-7.5L25 15v18l-12.98 7.5L0 33V15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
            }}
          />
          <div className="pointer-events-none absolute -left-16 top-0 h-48 w-48 rounded-full bg-white/10 blur-3xl" />
          <div className="pointer-events-none absolute -right-10 bottom-0 h-40 w-40 rounded-full bg-amber-300/15 blur-3xl" />

          <div className="relative flex items-start justify-between gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25 backdrop-blur-md">
              <Store className="h-5 w-5 text-white" aria-hidden />
            </div>
            <Badge
              variant="secondary"
              className="shrink-0 gap-1 border border-white/25 bg-white/15 font-medium text-white backdrop-blur-md hover:bg-white/20"
            >
              <MapPin className="h-3 w-3 opacity-90" aria-hidden />
              {cityLabel}
            </Badge>
          </div>

          <div className="relative mt-5 flex items-end justify-between gap-4">
            <div className="min-w-0 flex-1">
              <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/75">
                <Sparkles className="h-3 w-3" aria-hidden />
                {t("shops.shelfPreview")}
              </p>
              <h2 className="mt-1.5 font-display text-lg font-bold leading-tight tracking-tight text-white drop-shadow-sm md:text-xl">
                {shop.name}
              </h2>
            </div>

            <div
              className="flex shrink-0 items-end pr-1"
              aria-hidden={previews.length === 0}
            >
              {previews.length === 0 ? (
                <div className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-2xl border border-white/25 bg-white/10 shadow-inner ring-1 ring-white/20">
                  <Package className="h-8 w-8 text-white/55" />
                </div>
              ) : (
                <div className="flex items-end -space-x-4 rtl:space-x-reverse">
                  {previews.map((src, i) => (
                    <PreviewThumb
                      key={`${src}-${i}`}
                      src={src}
                      alt=""
                      style={{
                        zIndex: 30 - i,
                        transform: `rotate(${i === 0 ? -5 : i === 1 ? 4 : -2}deg) translateY(${i * -2}px)`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-3 border-t border-brand-100/60 bg-gradient-to-b from-white to-brand-50/20 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-brand-600">
            <Package className="h-3.5 w-3.5 text-brand-500" aria-hidden />
            <span>{listed}</span>
          </div>
          <p className="line-clamp-3 text-sm leading-relaxed text-brand-800/92">
            {shop.description || t("shops.noDescription")}
          </p>
          <p className="text-xs text-brand-500">{shop.phone}</p>
          <div className="mt-auto pt-1">
            <Button
              asChild
              className="w-full gap-2 rounded-2xl shadow-sm transition-transform duration-300 group-hover/card:shadow-md"
              size="lg"
            >
              <Link href={`/shops/${shop.id}`}>
                {t("shops.enterShop")}
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover/card:translate-x-0.5" />
              </Link>
            </Button>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}
