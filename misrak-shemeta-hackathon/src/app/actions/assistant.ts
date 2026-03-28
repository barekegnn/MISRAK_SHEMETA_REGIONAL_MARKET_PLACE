"use server";

import { getGeminiModel } from "@/lib/gemini/client";
import { detectLanguageFromText, languageLabel } from "@/lib/i18n/detect";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  AssistantResponse,
  AssistantProductCard,
  DeliveryZone,
  LanguageCode,
  ShopCity,
} from "@/types";

function fallbackMessage(lang: LanguageCode): string {
  const m = {
    am: "ይቅርታ፣ AI አገልግሎት አሁን የለም። ካታሎጉን ይመልከቱ።",
    om: "Dhiifama, deeggarsi AI ammaa hin jiru. Gabaa ilaali.",
    en: "Sorry, the AI assistant is temporarily unavailable. Please browse the catalog.",
  };
  return m[lang];
}

type Row = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category: string;
  images: string[] | null;
  shops: {
    id: string;
    name: string;
    city: ShopCity;
    phone: string;
    description: string | null;
  } | null;
};

function buildCards(
  answer: string,
  rows: Row[],
  deliveryZone: DeliveryZone
): AssistantProductCard[] {
  const mentioned = rows.filter((r) => answer.includes(r.name)).slice(0, 6);
  const pick = mentioned.length > 0 ? mentioned : rows.slice(0, 4);
  return pick.map((p) => {
    const shop = p.shops!;
    let delivery_fee: number | undefined;
    try {
      delivery_fee = calculateDeliveryFee(shop.city, deliveryZone).fee;
    } catch {
      delivery_fee = undefined;
    }
    const imgs = p.images || [];
    return {
      id: p.id,
      shop_id: shop.id,
      name: p.name,
      price: Number(p.price),
      image_url: imgs[0] || "/icons/icon-192.png",
      shop_name: shop.name,
      shop_phone: shop.phone,
      shop_city: shop.city,
      view_url: `/products/${p.id}`,
      delivery_fee,
    };
  });
}

export async function queryAssistant(
  question: string,
  deliveryZone: DeliveryZone
): Promise<AssistantResponse> {
  const lang = detectLanguageFromText(question);
  const supabase = createServiceClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(
      `
      id, name, description, price, stock, category, images,
      shops ( id, name, city, phone, description )
    `
    )
    .eq("is_active", true)
    .limit(80);

  if (error || !products?.length) {
    return {
      answer: fallbackMessage(lang),
      language: lang,
      products: [],
      shops: [],
    };
  }

  const rows = products as unknown as Row[];

  const ctx = rows
    .map((p) => {
      const shop = p.shops;
      const city = shop?.city || "Harar";
      let route = "";
      try {
        const q = calculateDeliveryFee(city, deliveryZone);
        route = `Delivery to ${deliveryZone}: ${q.fee} ETB (${q.estimatedTime})`;
      } catch {
        route = "";
      }
      const imgs = p.images || [];
      return [
        `PRODUCT_ID: ${p.id}`,
        `Name: ${p.name}`,
        `Price: ${p.price} ETB`,
        `Stock: ${p.stock}`,
        `Description: ${p.description}`,
        `Image: ${imgs[0] ?? ""}`,
        `Shop: ${shop?.name ?? ""}`,
        `Phone: ${shop?.phone ?? ""}`,
        route,
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n\n---\n\n");

  const system = `You are Misrak Shemeta's Shop Assistant for Eastern Ethiopia.
Buyer zone: ${deliveryZone}. Reply ONLY in ${languageLabel(lang)}.
Always include product price (ETB), shop phone, stock, and delivery to ${deliveryZone} when recommending items.

CATALOG:
${ctx}

Question: ${question}`;

  try {
    const model = getGeminiModel();
    const gen = model.generateContent(system);
    const result = await Promise.race([
      gen,
      new Promise<never>((_, rej) =>
        setTimeout(() => rej(new Error("timeout")), 5000)
      ),
    ]);
    const answer = result.response.text() || "";

    const productCards = buildCards(answer, rows, deliveryZone);
    const shops = [
      ...new Map(
        productCards.map((c) => [
          c.shop_id,
          {
            id: c.shop_id,
            name: c.shop_name,
            city: c.shop_city,
            phone: c.shop_phone,
            description: null as string | null,
          },
        ])
      ).values(),
    ];

    return {
      answer,
      language: lang,
      products: productCards,
      shops,
    };
  } catch {
    return {
      answer: fallbackMessage(lang),
      language: lang,
      products: buildCards("", rows, deliveryZone).slice(0, 3),
      shops: [],
    };
  }
}
