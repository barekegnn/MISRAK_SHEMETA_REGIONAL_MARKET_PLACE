import { notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import { ProductDetailClient } from "./product-actions";
import type { DeliveryZone } from "@/types";

export default async function ProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  let deliveryZone: DeliveryZone = "Haramaya_Campus";
  if (userData.user?.id) {
    const { data: u } = await supabase
      .from("users")
      .select("delivery_zone")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (u?.delivery_zone) deliveryZone = u.delivery_zone as DeliveryZone;
  }

  const { data: product, error } = await supabase
    .from("products")
    .select(
      `id, name, description, price, stock, category, images,
       shops ( id, name, city, phone, description )`
    )
    .eq("id", id)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product) notFound();

  const shopsRel = product.shops as unknown;
  const shopObj = Array.isArray(shopsRel) ? shopsRel[0] : shopsRel;

  return (
    <ProductDetailClient
      product={{
        ...product,
        shops: shopObj as Parameters<typeof ProductDetailClient>[0]["product"]["shops"],
      }}
      deliveryZone={deliveryZone}
    />
  );
}
