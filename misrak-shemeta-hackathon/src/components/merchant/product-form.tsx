"use client";

import { useState } from "react";
import { createProduct, deleteProduct } from "@/app/actions/products";
import type { ProductCategory } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";

const CATS: ProductCategory[] = [
  "Textbooks",
  "Electronics",
  "Clothing",
  "Stationery",
  "Food & Beverages",
  "Accessories",
  "Home & Living",
  "Other",
];

export function ProductForm({ onDone }: { onDone: () => void }) {
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const fd = new FormData(form);
    const fileList = fd.getAll("images") as File[];
    const files = fileList.filter((f) => f instanceof File && f.size > 0);
    const buffers = await Promise.all(
      files.map(async (f) => ({
        name: f.name,
        type: f.type,
        data: new Uint8Array(await f.arrayBuffer()),
      }))
    );
    setLoading(true);
    try {
      await createProduct(
        {
          name: String(fd.get("name") || ""),
          description: String(fd.get("description") || ""),
          price: Number(fd.get("price")),
          stock: Number(fd.get("stock")),
          category: String(fd.get("category")) as ProductCategory,
        },
        buffers
      );
      form.reset();
      onDone();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card className="p-5">
      <h2 className="mb-4 font-display text-xl font-bold">New product</h2>
      <form className="space-y-3" onSubmit={(e) => void onSubmit(e)}>
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" name="name" required className="mt-1 rounded-xl" />
        </div>
        <div>
          <Label htmlFor="description">Description (200+ chars)</Label>
          <Textarea
            id="description"
            name="description"
            required
            minLength={200}
            rows={6}
            className="mt-1 rounded-xl"
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label htmlFor="price">Price ETB</Label>
            <Input id="price" name="price" type="number" step="0.01" required className="mt-1 rounded-xl" />
          </div>
          <div>
            <Label htmlFor="stock">Stock</Label>
            <Input id="stock" name="stock" type="number" required className="mt-1 rounded-xl" />
          </div>
        </div>
        <div>
          <Label htmlFor="category">Category</Label>
          <select
            id="category"
            name="category"
            className="mt-1 w-full rounded-xl border border-brand-200 p-2"
          >
            {CATS.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label htmlFor="images">Images</Label>
          <Input
            id="images"
            name="images"
            type="file"
            accept="image/*"
            multiple
            className="mt-1"
          />
        </div>
        <Button type="submit" className="rounded-xl" disabled={loading}>
          {loading ? "Saving…" : "Create"}
        </Button>
      </form>
    </Card>
  );
}

export function ProductRow({
  id,
  name,
  onRemoved,
}: {
  id: string;
  name: string;
  onRemoved: () => void;
}) {
  return (
    <div className="flex items-center justify-between gap-2 rounded-xl border border-brand-100 bg-white px-4 py-3">
      <span className="font-medium">{name}</span>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-lg text-red-600"
        onClick={async () => {
          if (!confirm("Deactivate listing?")) return;
          await deleteProduct(id);
          onRemoved();
        }}
      >
        Deactivate
      </Button>
    </div>
  );
}
