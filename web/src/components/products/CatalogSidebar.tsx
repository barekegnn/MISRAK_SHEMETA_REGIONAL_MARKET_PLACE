"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { SHOP_CITIES } from "@/lib/constants";
import type { ShopCity } from "@/types";
import { useI18n } from "@/lib/i18n/context";
import { translateShopCity } from "@/lib/i18n/labels";

export function CatalogSidebar() {
  const { t } = useI18n();
  const router = useRouter();
  const params = useSearchParams();
  const [, startTransition] = useTransition();

  const city = (params.get("city") as ShopCity | null) ?? "";

  const setParams = useCallback(
    (next: Record<string, string | undefined>) => {
      const p = new URLSearchParams(params.toString());
      Object.entries(next).forEach(([k, v]) => {
        if (v === undefined || v === "") p.delete(k);
        else p.set(k, v);
      });
      startTransition(() => {
        router.push(`/products?${p.toString()}`);
      });
    },
    [params, router],
  );

  return (
    <aside className="space-y-6">
      <div>
        <Label className="text-sm font-semibold text-neutral-800">
          {t("catalog_city")}
        </Label>
        <div className="mt-2 flex flex-col gap-1">
          {SHOP_CITIES.map(({ value }) => (
            <Button
              key={value || "all"}
              variant={city === value ? "default" : "ghost"}
              className="justify-start"
              onClick={() => setParams({ city: value || undefined })}
            >
              {translateShopCity(value, t)}
            </Button>
          ))}
        </div>
      </div>
      <Button
        variant="outline"
        className="w-full"
        onClick={() => startTransition(() => router.push("/products"))}
      >
        {t("catalog_clearFilters")}
      </Button>
    </aside>
  );
}
