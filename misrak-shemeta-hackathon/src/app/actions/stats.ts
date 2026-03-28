"use server";

import { createServiceClient } from "@/lib/supabase/service";

export type PlatformStats = {
  products: number;
  shops: number;
  buyers: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const svc = createServiceClient();

  const [{ count: products }, { count: shops }, { count: buyers }] =
    await Promise.all([
      svc.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
      svc.from("shops").select("id", { count: "exact", head: true }).eq("is_active", true),
      svc
        .from("users")
        .select("id", { count: "exact", head: true })
        .eq("role", "buyer"),
    ]);

  return {
    products: products ?? 0,
    shops: shops ?? 0,
    buyers: buyers ?? 0,
  };
}
