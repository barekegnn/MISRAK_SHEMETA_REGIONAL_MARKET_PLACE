"use server";

import { createServerSupabase } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const categoryEnum = z.enum([
  "Textbooks",
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Stationery",
  "Accessories",
  "Home & Living",
  "Other",
]);

const productBase = z.object({
  name: z.string().min(2).max(200),
  description: z.string().min(200).max(8000),
  price: z.coerce.number().positive(),
  stock: z.coerce.number().int().min(0),
  category: categoryEnum,
});

async function getMyShopId(
  supabase: Awaited<ReturnType<typeof createServerSupabase>>
) {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("SIGN_IN_REQUIRED");
  const { data } = await supabase
    .from("shops")
    .select("id")
    .eq("owner_id", user.id)
    .maybeSingle();
  if (!data?.id) throw new Error("NO_SHOP");
  return { userId: user.id, shopId: data.id as string };
}

export async function getProductsByShop() {
  const supabase = await createServerSupabase();
  const { shopId } = await getMyShopId(supabase);
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .eq("shop_id", shopId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function createProduct(
  input: z.infer<typeof productBase>,
  imageFiles: { name: string; type: string; data: Uint8Array }[]
) {
  const parsed = productBase.safeParse(input);
  if (!parsed.success) throw new Error("VALIDATION");

  const supabase = await createServerSupabase();
  const { shopId } = await getMyShopId(supabase);

  const { data: row, error } = await supabase
    .from("products")
    .insert({
      shop_id: shopId,
      name: parsed.data.name,
      description: parsed.data.description,
      price: parsed.data.price,
      stock: parsed.data.stock,
      category: parsed.data.category,
      images: [] as string[],
    })
    .select("id")
    .single();

  if (error || !row) throw new Error(error?.message || "INSERT_FAILED");

  const productId = row.id as string;
  const urls: string[] = [];
  const svc = createServiceClient();

  for (let i = 0; i < imageFiles.length; i++) {
    const f = imageFiles[i];
    const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_") || `img-${i}.webp`;
    const path = `${shopId}/${productId}/${Date.now()}-${safeName}`;
    const { error: upErr } = await svc.storage
      .from("products")
      .upload(path, f.data, { contentType: f.type || "image/jpeg", upsert: true });
    if (upErr) continue;
    const { data: pub } = svc.storage.from("products").getPublicUrl(path);
    if (pub?.publicUrl) urls.push(pub.publicUrl);
  }

  await supabase
    .from("products")
    .update({
      images: urls.length ? urls : ["/icons/icon-192.png"],
    })
    .eq("id", productId);

  revalidatePath("/merchant/products");
  revalidatePath("/products");
}

export async function updateProduct(
  productId: string,
  patch: Partial<z.infer<typeof productBase>>
) {
  const supabase = await createServerSupabase();
  await getMyShopId(supabase);

  const { error } = await supabase
    .from("products")
    .update({
      ...patch,
      updated_at: new Date().toISOString(),
    })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/merchant/products");
  revalidatePath("/products");
  revalidatePath(`/products/${productId}`);
}

export async function deleteProduct(productId: string) {
  const supabase = await createServerSupabase();
  await getMyShopId(supabase);
  const { error } = await supabase
    .from("products")
    .update({ is_active: false, updated_at: new Date().toISOString() })
    .eq("id", productId);
  if (error) throw new Error(error.message);
  revalidatePath("/merchant/products");
  revalidatePath("/products");
}
