"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { ProductCategory, ShopCity } from "@/types";

const SCHEMA_MISSING_HINT =
  "Supabase has no app tables yet. Dashboard → SQL Editor → run the full script in misrak-shemeta-hackathon/supabase/apply_all.sql — then npm run seed.";

function assertNoFatalSchemaError(error: { message?: string; code?: string } | null) {
  if (!error) return;
  const code = error.code ?? "";
  const msg = error.message ?? "";
  if (
    code === "PGRST205" ||
    msg.includes("schema cache") ||
    msg.includes("Could not find the table")
  ) {
    throw new Error(`${msg} ${SCHEMA_MISSING_HINT}`);
  }
}

export type PublicShopListRow = {
  id: string;
  name: string;
  city: ShopCity;
  phone: string;
  description: string | null;
};

export async function getPublicShops(filters?: { city?: ShopCity | "all" }) {
  const supabase = await createServerSupabase();
  let q = supabase
    .from("shops")
    .select("id, name, city, phone, description, created_at")
    .eq("is_active", true);
  if (filters?.city && filters.city !== "all") {
    q = q.eq("city", filters.city);
  }
  const { data, error } = await q.order("name", { ascending: true });
  assertNoFatalSchemaError(error);
  if (error) throw new Error(error.message);
  return (data ?? []) as PublicShopListRow[];
}

export async function getPublicProducts(filters?: {
  shopId?: string;
  q?: string;
  city?: ShopCity | "all";
  category?: ProductCategory | "all";
  min?: number;
  max?: number;
}) {
  const supabase = await createServerSupabase();
  let q = supabase
    .from("products")
    .select(
      `
      id, name, description, price, stock, category, images, created_at,
      shops ( id, name, city, phone, is_active )
    `
    )
    .eq("is_active", true);

  if (filters?.shopId) {
    q = q.eq("shop_id", filters.shopId);
  }
  if (filters?.category && filters.category !== "all") {
    q = q.eq("category", filters.category);
  }
  if (filters?.min != null) q = q.gte("price", filters.min);
  if (filters?.max != null) q = q.lte("price", filters.max);

  const { data, error } = await q.order("created_at", { ascending: false });
  assertNoFatalSchemaError(error);
  if (error) throw new Error(error.message);

  let rows = data ?? [];
  if (!filters?.shopId && filters?.city && filters.city !== "all") {
    rows = rows.filter((p) => {
      const s = p.shops as unknown;
      const one = Array.isArray(s) ? s[0] : s;
      return (one as { city?: ShopCity } | null)?.city === filters.city;
    });
  }
  if (filters?.q?.trim()) {
    const s = filters.q.toLowerCase();
    rows = rows.filter(
      (p) =>
        (p.name as string).toLowerCase().includes(s) ||
        (p.description as string).toLowerCase().includes(s)
    );
  }

  return rows.filter((p) => {
    const s = p.shops as unknown;
    const one = Array.isArray(s) ? s[0] : s;
    return (one as { is_active?: boolean } | null)?.is_active === true;
  });
}

export async function getProduct(id: string) {
  const supabase = await createServerSupabase();
  const { data, error } = await supabase
    .from("products")
    .select(
      `id, name, description, price, stock, category, images,
       shops ( id, name, city, phone, description, is_active )`
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();
  assertNoFatalSchemaError(error);
  if (error) throw new Error(error.message);
  return data;
}
