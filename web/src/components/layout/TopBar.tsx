"use client";

import Link from "next/link";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth/context";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { DELIVERY_ZONES } from "@/lib/constants";
import {
  translateDeliveryZone,
  translateShopCity,
} from "@/lib/i18n/labels";
import type { ShopCity } from "@/types";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n/context";

export function TopBar() {
  const { deliveryZone, setDeliveryZone } = useAuth();
  const { t } = useI18n();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [zoneOpen, setZoneOpen] = useState(false);
  const label = translateDeliveryZone(deliveryZone, t);
  const activeCity = searchParams.get("city") ?? "All";
  const cityLinks: { value: string; href: string; city: ShopCity | "All" }[] =
    [
      { value: "All", href: "/", city: "All" },
      { value: "Harar", href: "/?city=Harar", city: "Harar" },
      { value: "Dire_Dawa", href: "/?city=Dire_Dawa", city: "Dire_Dawa" },
      { value: "Haramaya", href: "/?city=Haramaya", city: "Haramaya" },
      { value: "Jijiga", href: "/?city=Jijiga", city: "Jijiga" },
    ];

  return (
    <div className="bg-[#1E1B4B] text-white text-sm">
      <div className="mx-auto flex max-w-[1440px] flex-col gap-2 px-3 py-2 md:px-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex min-w-0 items-center gap-3">
            <Link href="/" className="hidden shrink-0 text-lg md:inline">
              🌅
            </Link>
            <Sheet open={zoneOpen} onOpenChange={setZoneOpen}>
              <button
                type="button"
                onClick={() => setZoneOpen(true)}
                className="flex min-w-0 items-center gap-1.5 rounded-sm px-1 py-0.5 text-left outline-none hover:underline focus-visible:ring-2 focus-visible:ring-amber-400"
              >
                <MapPin className="size-4 shrink-0 text-amber-400" />
                <span className="truncate">
                  <span className="text-neutral-300">{t("deliverTo")} · </span>
                  <span className="font-medium">{label}</span>
                </span>
              </button>
              <SheetContent side="bottom" className="h-[70vh]">
                <SheetHeader>
                  <SheetTitle>{t("selectZone")}</SheetTitle>
                </SheetHeader>
                <div className="mt-4 grid gap-2">
                  {DELIVERY_ZONES.map((z) => (
                    <Button
                      key={z.value}
                      variant={deliveryZone === z.value ? "default" : "outline"}
                      className="justify-start"
                      onClick={() => {
                        setDeliveryZone(z.value);
                        setZoneOpen(false);
                      }}
                    >
                      {translateDeliveryZone(z.value, t)}
                    </Button>
                  ))}
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="shrink-0">
            <LanguageSwitcher variant="onDark" />
          </div>
        </div>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {cityLinks.map((link) => {
            const isActive =
              pathname === "/" && activeCity === link.value;
            const cityLabel =
              link.city === "All"
                ? t("topBar_allShops")
                : translateShopCity(link.city, t);

            return (
              <Link
                key={link.value}
                href={link.href}
                className={`shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                  isActive
                    ? "bg-white text-[#1E1B4B]"
                    : "bg-white/10 text-white hover:bg-white/20"
                }`}
              >
                {cityLabel}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
