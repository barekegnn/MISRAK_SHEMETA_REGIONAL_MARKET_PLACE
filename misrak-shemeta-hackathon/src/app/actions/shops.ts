"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import type { ShopCity } from "@/types";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const registerSchema = z.object({
  name: z.string().min(2).max(120),
  city: z.enum(["Harar", "Dire_Dawa", "Aweday", "Jigjiga", "Haramaya", "Jijiga"]),
  phone: z.string().min(9).max(20),
  description: z.string().max(2000).optional(),
});

export async function registerShop(
  input: z.infer<typeof registerSchema>
) {
  const parsed = registerSchema.safeParse(input);
  if (!parsed.success) throw new Error("VALIDATION");

  const supabase = await createServerSupabase();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");

  const { data: existing } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (existing) throw new Error("SHOP_EXISTS");

  const { error } = await supabase.from("shops").insert({
    owner_id: user.id,
    name: parsed.data.name,
    city: parsed.data.city as ShopCity,
    phone: parsed.data.phone,
    description: parsed.data.description ?? null,
  });

  if (error) throw new Error(error.message);

  await supabase.from("users").update({ role: "seller" }).eq("id", user.id);

  revalidatePath("/merchant");
}
