"use client";

import { useMemo } from "react";
import { useLocale } from "@/components/providers/locale-provider";
import type { ProductCategory, ShopCity } from "@/types";
import { SHOP_CITIES } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const CATEGORIES: (ProductCategory | "all")[] = [
  "all",
  "Textbooks",
  "Electronics",
  "Clothing",
  "Stationery",
  "Food & Beverages",
  "Accessories",
  "Home & Living",
  "Other",
];

const CITIES: (ShopCity | "all")[] = ["all", ...SHOP_CITIES];

export type ProductFilters = {
  q: string;
  category: ProductCategory | "all";
  city: ShopCity | "all";
  min: number | null;
  max: number | null;
};

export function FilterPanel({
  value,
  onChange,
}: {
  value: ProductFilters;
  onChange: (v: ProductFilters) => void;
}) {
  const { t } = useLocale();
  const maxDefault = useMemo(() => 50000, []);

  return (
    <div className="space-y-4 rounded-2xl border border-brand-100 bg-white/90 p-4 shadow-sm">
      <div>
        <Label htmlFor="search">{t("products.searchPlaceholder")}</Label>
        <Input
          id="search"
          value={value.q}
          onChange={(e) => onChange({ ...value, q: e.target.value })}
          placeholder={t("products.searchPlaceholder")}
          className="mt-1 rounded-xl"
        />
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-brand-800">{t("products.category")}</p>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={value.category === c ? "default" : "secondary"}
              className="rounded-full"
              onClick={() => onChange({ ...value, category: c })}
            >
              {c === "all" ? t("products.all") : c}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-brand-800">{t("products.city")}</p>
        <div className="flex flex-wrap gap-2">
          {CITIES.map((c) => (
            <Button
              key={c}
              type="button"
              size="sm"
              variant={value.city === c ? "default" : "outline"}
              className="rounded-full"
              onClick={() => onChange({ ...value, city: c })}
            >
              {c === "all" ? t("products.all") : c}
            </Button>
          ))}
        </div>
      </div>
      <div>
        <p className="mb-2 text-sm font-medium text-brand-800">{t("products.priceRange")}</p>
        <div className="flex gap-3">
          <Input
            type="number"
            placeholder="Min"
            className="rounded-xl"
            value={value.min ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                min: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
          <Input
            type="number"
            placeholder="Max"
            className="rounded-xl"
            value={value.max ?? ""}
            onChange={(e) =>
              onChange({
                ...value,
                max: e.target.value === "" ? null : Number(e.target.value),
              })
            }
          />
        </div>
        <input
          type="range"
          min={0}
          max={maxDefault}
          step={100}
          className="mt-3 w-full accent-brand-500"
          value={value.max ?? maxDefault}
          onChange={(e) =>
            onChange({ ...value, max: Number(e.target.value) })
          }
          aria-label="max price"
        />
      </div>
    </div>
  );
}
