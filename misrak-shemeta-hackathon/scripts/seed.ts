/**
 * Demo seed — tasks 1.6, 13.1 (3 shops, 15 products, 4 demo users, 2 orders).
 * Run: npm run seed
 *
 * Runner zone = Haramaya_Campus matches buyer@ for DISPATCHED OTP (Req 19.5–19.6).
 * Req 19.1 lists runner Harar_City — conflicts with buyer Haramaya_Campus for OTP; seed uses matching zones.
 */

import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { randomInt } from "crypto";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const svcKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !svcKey) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const admin = createClient(url, svcKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const DEMO = [
  { email: "admin@misrak.demo", role: "admin" as const, delivery_zone: null as null, language: "en" as const },
  { email: "seller@misrak.demo", role: "seller" as const, delivery_zone: null, language: "en" as const },
  {
    email: "runner@misrak.demo",
    role: "runner" as const,
    delivery_zone: "Haramaya_Campus" as const,
    language: "en" as const,
  },
  {
    email: "buyer@misrak.demo",
    role: "buyer" as const,
    delivery_zone: "Haramaya_Campus" as const,
    language: "am" as const,
  },
];

const SHOPS = [
  {
    name: "Harar Book Hub",
    city: "Harar" as const,
    phone: "+251912100001",
    description:
      "Campus-focused textbooks, reference works, and study guides with runs to Haramaya and Harar.",
  },
  {
    name: "DDU Electronics",
    city: "Dire_Dawa" as const,
    phone: "+251912100002",
    description:
      "Laptops, accessories, and electronics for students around Dire Dawa University.",
  },
  {
    name: "Haramaya Essentials",
    city: "Harar" as const,
    phone: "+251912100003",
    description:
      "Snacks, hygiene, stationery, and dorm basics for Haramaya and Harar corridors.",
  },
];

async function ensureAuthUser(email: string, password: string) {
  const { data: list } = await admin.auth.admin.listUsers();
  const existing = list.users.find((u) => u.email === email);
  if (existing) return existing.id;
  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  });
  if (error) throw error;
  return data.user!.id;
}

function genOtp() {
  return String(randomInt(100000, 999999));
}

function desc(suffix: string) {
  const long =
    "Curated for Eastern Ethiopia. Fair pricing, quality-checked listings, and coordinated logistics across Harar, Dire Dawa, Haramaya, and Aweday. ";
  return long + long + suffix;
}

async function main() {
  for (const d of DEMO) {
    const id = await ensureAuthUser(d.email, "demo1234");
    await admin
      .from("users")
      .update({
        role: d.role,
        delivery_zone: d.delivery_zone,
        language: d.language,
        full_name: d.email.split("@")[0],
      })
      .eq("id", id);
  }

  const { data: sellerRow } = await admin
    .from("users")
    .select("id")
    .eq("email", "seller@misrak.demo")
    .single();
  const sellerId = sellerRow!.id as string;

  const shopIds: string[] = [];
  for (const s of SHOPS) {
    const { data: ex } = await admin.from("shops").select("id").eq("name", s.name).maybeSingle();
    if (ex?.id) {
      shopIds.push(ex.id as string);
      continue;
    }
    const { data: ins, error } = await admin
      .from("shops")
      .insert({
        owner_id: sellerId,
        name: s.name,
        city: s.city,
        phone: s.phone,
        description: s.description,
      })
      .select("id")
      .single();
    if (error) throw error;
    shopIds.push(ins!.id as string);
  }

  const [hubId, dduId, essId] = shopIds;

  const { count: totalProducts } = await admin
    .from("products")
    .select("id", { count: "exact", head: true });
  if ((totalProducts ?? 0) < 15) {
    const img = (n: number) =>
      `https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=800&q=80&auto=format&sig=${n}`;
    const rows = [
      { shop_id: hubId, name: "Engineering Mathematics Vol I", cat: "Textbooks" as const, price: 520, stock: 40, n: 1 },
      { shop_id: hubId, name: "Organic Chemistry Study Pack", cat: "Textbooks" as const, price: 680, stock: 25, n: 2 },
      { shop_id: hubId, name: "English for Academic Purposes", cat: "Textbooks" as const, price: 410, stock: 55, n: 3 },
      { shop_id: hubId, name: "Ethiopian History Reader", cat: "Textbooks" as const, price: 360, stock: 60, n: 4 },
      { shop_id: hubId, name: "Campus Physics Workbook", cat: "Textbooks" as const, price: 290, stock: 45, n: 5 },
      { shop_id: dduId, name: "Student Laptop 14\"", cat: "Electronics" as const, price: 18500, stock: 8, n: 6 },
      { shop_id: dduId, name: "Wireless Mouse Kit", cat: "Electronics" as const, price: 450, stock: 30, n: 7 },
      { shop_id: dduId, name: "USB-C Hub 6-in-1", cat: "Electronics" as const, price: 890, stock: 20, n: 8 },
      { shop_id: dduId, name: "Bluetooth Speaker", cat: "Electronics" as const, price: 1200, stock: 15, n: 9 },
      { shop_id: essId, name: "Campus Hoodie Gray", cat: "Clothing" as const, price: 780, stock: 35, n: 10 },
      { shop_id: essId, name: "Running Sneakers", cat: "Clothing" as const, price: 1450, stock: 22, n: 11 },
      { shop_id: essId, name: "Notebook Bundle 5-pack", cat: "Stationery" as const, price: 180, stock: 80, n: 12 },
      { shop_id: essId, name: "Desk Organizer Set", cat: "Stationery" as const, price: 320, stock: 40, n: 13 },
      { shop_id: essId, name: "Energy Bars Box", cat: "Food & Beverages" as const, price: 260, stock: 50, n: 14 },
      { shop_id: essId, name: "LED Desk Lamp", cat: "Home & Living" as const, price: 590, stock: 18, n: 15 },
    ].map((p) => ({
      shop_id: p.shop_id,
      name: p.name,
      description: desc(`${p.name} — Misrak Shemeta pilot listing.`),
      price: p.price,
      stock: p.stock,
      category: p.cat,
      images: [img(p.n)],
      is_active: true,
    }));
    const { error: pe } = await admin.from("products").insert(rows);
    if (pe) throw pe;
  }

  const { data: buyerRow } = await admin
    .from("users")
    .select("id")
    .eq("email", "buyer@misrak.demo")
    .single();
  const buyerId = buyerRow!.id as string;

  const { data: prod } = await admin
    .from("products")
    .select("id, name, price, shop_id, shops(city)")
    .eq("shop_id", hubId)
    .limit(1)
    .single();

  if (prod) {
    const price = Number(prod.price);
    const shopNest = prod.shops as unknown;
    const shopOne = Array.isArray(shopNest) ? shopNest[0] : shopNest;
    const city = (shopOne as { city: string }).city;
    const orderItem = {
      product_id: prod.id as string,
      shop_id: hubId,
      product_name: prod.name as string,
      quantity: 1,
      price_at_purchase: price,
      shop_city: city,
    };
    const subtotal = price;
    const deliveryFee = 100;
    const total = subtotal + deliveryFee;

    await admin.from("orders").delete().eq("buyer_id", buyerId);

    await admin.from("orders").insert([
      {
        buyer_id: buyerId,
        shop_id: hubId,
        items: [orderItem],
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "PAID_ESCROW",
        otp: genOtp(),
      },
      {
        buyer_id: buyerId,
        shop_id: hubId,
        items: [orderItem],
        subtotal,
        delivery_fee: deliveryFee,
        total,
        status: "DISPATCHED",
        otp: genOtp(),
      },
    ]);
  }

  console.log("Seed complete.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
