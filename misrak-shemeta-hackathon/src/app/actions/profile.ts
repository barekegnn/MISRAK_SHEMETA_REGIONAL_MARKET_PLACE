"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { DeliveryZone, LanguageCode } from "@/types";
import { revalidatePath } from "next/cache";

export async function updateBuyerProfile(params: {
  delivery_zone?: DeliveryZone;
  language?: LanguageCode;
  full_name?: string;
}) {
  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");

  const patch: Record<string, unknown> = {
    updated_at: new Date().toISOString(),
  };
  if (params.delivery_zone != null) patch.delivery_zone = params.delivery_zone;
  if (params.language != null) patch.language = params.language;
  if (params.full_name != null) patch.full_name = params.full_name;

  const { error } = await supabase
    .from("users")
    .update(patch)
    .eq("id", user.id);
  if (error) throw new Error(error.message);

  revalidatePath("/", "layout");
}
