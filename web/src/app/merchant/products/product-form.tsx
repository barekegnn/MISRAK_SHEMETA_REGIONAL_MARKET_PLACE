"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/ui/link-button";
import { Textarea } from "@/components/ui/textarea";
import { PRODUCT_CATEGORIES } from "@/lib/constants";
import type { Product, ProductCategory, Shop } from "@/types";

type Props = {
  mode: "create" | "edit";
  shops: Shop[];
  product?: Product;
  /** After save, navigate here (default `/merchant/products`). */
  redirectAfterSave?: string;
  cancelHref?: string;
};

export function MerchantProductForm({
  mode,
  shops,
  product,
  redirectAfterSave = "/merchant/products",
  cancelHref = "/merchant/products",
}: Props) {
  const router = useRouter();
  const [shopId, setShopId] = useState(product?.shop_id ?? shops[0]?.id ?? "");
  const [name, setName] = useState(product?.name ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [price, setPrice] = useState(String(product?.price ?? ""));
  const [stock, setStock] = useState(String(product?.stock ?? 0));
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? "Other");
  const [imageUrls, setImageUrls] = useState((product?.images ?? []).join("\n"));
  const [isActive, setIsActive] = useState(product?.is_active ?? true);
  const [saving, setSaving] = useState(false);

  const filteredCategories = useMemo(
    () => PRODUCT_CATEGORIES.filter((value): value is ProductCategory => value !== "All"),
    [],
  );

  async function handleSubmit() {
    setSaving(true);
    try {
      const response = await fetch(
        mode === "create" ? "/api/dashboard/products" : `/api/dashboard/products/${product?.id}`,
        {
          method: mode === "create" ? "POST" : "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            shopId,
            name,
            description,
            price: Number(price),
            stock: Number(stock),
            category,
            imageUrls: imageUrls
              .split(/\r?\n/)
              .map((value) => value.trim())
              .filter(Boolean),
            isActive,
          }),
        },
      );
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to save product.");
      }

      toast.success(payload.message ?? "Product saved.");
      router.push(redirectAfterSave);
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to save product.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-shop">Storefront</Label>
          <select
            id="product-shop"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={shopId}
            onChange={(event) => setShopId(event.target.value)}
          >
            {shops.map((shop) => (
              <option key={shop.id} value={shop.id}>
                {shop.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-category">Category</Label>
          <select
            id="product-category"
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={category}
            onChange={(event) => setCategory(event.target.value as ProductCategory)}
          >
            {filteredCategories.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-name">Product name</Label>
        <Input
          id="product-name"
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Wireless mouse"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-description">Description</Label>
        <Textarea
          id="product-description"
          value={description}
          onChange={(event) => setDescription(event.target.value)}
          placeholder="What makes this item useful for students and buyers?"
          rows={5}
        />
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="product-price">Price (ETB)</Label>
          <Input
            id="product-price"
            type="number"
            min="1"
            step="0.01"
            value={price}
            onChange={(event) => setPrice(event.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="product-stock">Stock</Label>
          <Input
            id="product-stock"
            type="number"
            min="0"
            step="1"
            value={stock}
            onChange={(event) => setStock(event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="product-images">Image URLs</Label>
        <Textarea
          id="product-images"
          value={imageUrls}
          onChange={(event) => setImageUrls(event.target.value)}
          placeholder="One image URL per line"
          rows={4}
        />
      </div>

      <label className="flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(event) => setIsActive(event.target.checked)}
        />
        Publish this product to the live catalog as soon as it is saved.
      </label>

      <div className="flex flex-wrap gap-3 pt-2">
        <Button type="button" onClick={() => void handleSubmit()} disabled={saving}>
          {saving
            ? mode === "create"
              ? "Creating..."
              : "Saving..."
            : mode === "create"
              ? "Create product"
              : "Save changes"}
        </Button>
        <LinkButton href={cancelHref} variant="outline">
          Cancel
        </LinkButton>
      </div>
    </div>
  );
}
