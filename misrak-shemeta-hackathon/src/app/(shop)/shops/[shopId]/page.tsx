import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ShopProductsClient } from "./shop-products-client";

export default async function ShopDetailPage({
  params,
}: {
  params: Promise<{ shopId: string }>;
}) {
  const { shopId } = await params;
  const supabase = await createServerSupabase();
  const { data: shop, error } = await supabase
    .from("shops")
    .select("id, name, city, phone, description")
    .eq("id", shopId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !shop) notFound();

  return <ShopProductsClient shop={shop} />;
}
