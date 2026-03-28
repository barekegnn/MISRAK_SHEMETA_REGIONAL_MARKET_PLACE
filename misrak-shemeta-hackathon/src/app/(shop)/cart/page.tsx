import { createServerSupabase } from "@/lib/supabase/server";
import { CartView } from "./cart-view";
import type { DeliveryZone } from "@/types";

export default async function CartPage() {
  const supabase = await createServerSupabase();
  const { data: userData } = await supabase.auth.getUser();
  let zone: DeliveryZone = "Haramaya_Campus";
  if (userData.user?.id) {
    const { data: u } = await supabase
      .from("users")
      .select("delivery_zone")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (u?.delivery_zone) zone = u.delivery_zone as DeliveryZone;
  }
  return <CartView zone={zone} />;
}
