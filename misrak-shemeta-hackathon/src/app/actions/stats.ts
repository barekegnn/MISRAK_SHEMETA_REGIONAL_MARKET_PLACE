"use server";

import { createServiceClient } from "@/lib/supabase/service";

export type PlatformStats = {
  products: number;
  shops: number;
  buyers: number;
};

export async function getPlatformStats(): Promise<PlatformStats> {
  const svc = createServiceClient();

  const [pr, sh, bu] = await Promise.all([
    svc.from("products").select("id", { count: "exact", head: true }).eq("is_active", true),
    svc.from("shops").select("id", { count: "exact", head: true }).eq("is_active", true),
    svc.from("users").select("id", { count: "exact", head: true }).eq("role", "buyer"),
  ]);

  const missing =
    pr.error?.code === "PGRST205" ||
    sh.error?.code === "PGRST205" ||
    bu.error?.code === "PGRST205" ||
    (pr.error?.message?.includes("schema cache") ?? false);

  if (missing) {
    return { products: 0, shops: 0, buyers: 0 };
  }

  return {
    products: pr.count ?? 0,
    shops: sh.count ?? 0,
    buyers: bu.count ?? 0,
  };
}
