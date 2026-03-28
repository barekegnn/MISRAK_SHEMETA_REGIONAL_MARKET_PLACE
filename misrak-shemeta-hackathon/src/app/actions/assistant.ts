"use server";

import { getGeminiModel } from "@/lib/gemini/client";
import { detectLanguageFromText, languageLabel } from "@/lib/i18n/detect";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { createServiceClient } from "@/lib/supabase/service";
import type {
  AssistantProductCard,
  AssistantResponse,
  AssistantShopCard,
  DeliveryZone,
  LanguageCode,
  ShopCity,
} from "@/types";

const PRODUCT_SELECT = `
  id, name, description, price, stock, category, images,
  shops ( id, name, city, phone, description, is_active )
`;
const MAX_CONTEXT_ROWS = 24;
const MAX_PRODUCT_CARDS = 4;
const MAX_SHOP_CARDS = 4;
const NOISE_TERMS = new Set([
  "a",
  "an",
  "and",
  "are",
  "do",
  "for",
  "have",
  "how",
  "i",
  "in",
  "is",
  "me",
  "need",
  "please",
  "product",
  "products",
  "recommend",
  "shop",
  "shops",
  "show",
  "tell",
  "the",
  "to",
  "want",
  "what",
  "which",
  "with",
]);

function fallbackMessage(lang: LanguageCode): string {
  const m = {
    am: "ይቅርታ፣ AI አገልግሎት አሁን የለም። ካታሎጉን ይመልከቱ።",
    om: "Dhiifama, deeggarsi AI ammaa hin jiru. Gabaa ilaali.",
    en: "Sorry, the AI assistant is temporarily unavailable. Please browse the catalog.",
  };
  return m[lang];
}

type ShopRow = {
  id: string;
  name: string;
  city: ShopCity;
  phone: string;
  description: string | null;
  is_active?: boolean | null;
};

type Row = {
  id: string;
  name: string;
  description: string;
  price: number | string;
  stock: number;
  category: string;
  images: string[] | null;
  shops: ShopRow | ShopRow[] | null;
};

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(text: string): string[] {
  const tokens = normalizeText(text).match(/[\p{L}\p{N}]+/gu) ?? [];
  return [...new Set(tokens.filter((token) => token.length > 1 && !NOISE_TERMS.has(token)))];
}

function toPrice(value: number | string): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : 0;
}

function getRowShop(row: Row): ShopRow | null {
  const shop = Array.isArray(row.shops) ? row.shops[0] : row.shops;
  if (!shop || shop.is_active === false) return null;
  return shop;
}

function routeSummary(shopCity: ShopCity, deliveryZone: DeliveryZone): string {
  try {
    const route = calculateDeliveryFee(shopCity, deliveryZone);
    return `${route.fee} ETB (${route.estimatedTime})`;
  } catch {
    return "not available";
  }
}

function dedupeRows(rows: Row[]): Row[] {
  const seen = new Set<string>();
  return rows.filter((row) => {
    if (seen.has(row.id)) return false;
    seen.add(row.id);
    return true;
  });
}

function rankRows(rows: Row[], question: string): Row[] {
  const normalizedQuestion = normalizeText(question);
  const terms = tokenize(question);

  return dedupeRows(rows)
    .filter((row) => getRowShop(row) !== null)
    .map((row) => {
      const shop = getRowShop(row)!;
      const fields: Array<{ value: string | null | undefined; weight: number }> = [
        { value: row.name, weight: 10 },
        { value: row.category, weight: 6 },
        { value: row.description, weight: 4 },
        { value: shop.name, weight: 9 },
        { value: shop.city, weight: 8 },
        { value: shop.description, weight: 3 },
      ];

      let score = row.stock > 0 ? 1 : 0;

      for (const field of fields) {
        const value = normalizeText(field.value ?? "");
        if (!value) continue;
        if (normalizedQuestion.includes(value)) score += field.weight * 3;
        for (const term of terms) {
          if (value.includes(term)) score += field.weight;
        }
      }

      return { row, score };
    })
    .sort((left, right) => {
      if (right.score !== left.score) return right.score - left.score;
      if (right.row.stock !== left.row.stock) return right.row.stock - left.row.stock;
      return toPrice(left.row.price) - toPrice(right.row.price);
    })
    .map(({ row }) => row);
}

function buildCatalogContext(rows: Row[], deliveryZone: DeliveryZone): string {
  const shopBlocks: string[] = [];
  const seenShops = new Set<string>();

  for (const row of rows) {
    const shop = getRowShop(row);
    if (!shop || seenShops.has(shop.id)) continue;
    seenShops.add(shop.id);

    const sampleProducts = rows
      .filter((candidate) => getRowShop(candidate)?.id === shop.id)
      .slice(0, 3)
      .map((candidate) => candidate.name)
      .join(", ");

    shopBlocks.push(
      [
        `SHOP_ID: ${shop.id}`,
        `Name: ${shop.name}`,
        `City: ${shop.city}`,
        `Phone: ${shop.phone}`,
        `Description: ${shop.description ?? "not provided"}`,
        sampleProducts ? `Sample products: ${sampleProducts}` : "",
      ]
        .filter(Boolean)
        .join("\n")
    );
  }

  const productBlocks = rows.map((row) => {
    const shop = getRowShop(row)!;
    const imgs = row.images || [];

    return [
      `PRODUCT_ID: ${row.id}`,
      `Name: ${row.name}`,
      `Category: ${row.category}`,
      `Price: ${toPrice(row.price)} ETB`,
      `Stock: ${row.stock}`,
      `Description: ${row.description || "not provided"}`,
      `Image: ${imgs[0] ?? ""}`,
      `Shop: ${shop.name}`,
      `City: ${shop.city}`,
      `Phone: ${shop.phone}`,
      `Delivery to ${deliveryZone}: ${routeSummary(shop.city, deliveryZone)}`,
    ]
      .filter(Boolean)
      .join("\n");
  });

  return [
    "SHOP_DIRECTORY:",
    shopBlocks.join("\n\n"),
    "",
    "PRODUCT_CATALOG:",
    productBlocks.join("\n\n---\n\n"),
  ].join("\n");
}

function buildCards(
  answer: string,
  rows: Row[],
  deliveryZone: DeliveryZone,
  question: string
): AssistantProductCard[] {
  const ranked = rankRows(rows, question);
  const normalizedAnswer = normalizeText(answer);
  const directlyMentioned = normalizedAnswer
    ? ranked.filter((row) => {
        const shop = getRowShop(row);
        return (
          normalizedAnswer.includes(normalizeText(row.name)) ||
          (!!shop && normalizedAnswer.includes(normalizeText(shop.name)))
        );
      })
    : [];
  const pick = dedupeRows([...directlyMentioned, ...ranked]).slice(0, MAX_PRODUCT_CARDS);

  return pick.map((p) => {
    const shop = getRowShop(p)!;
    const deliveryFee = routeSummary(shop.city, deliveryZone);
    const numericDeliveryFee = deliveryFee === "not available" ? undefined : calculateDeliveryFee(shop.city, deliveryZone).fee;
    const imgs = p.images || [];

    return {
      id: p.id,
      shop_id: shop.id,
      name: p.name,
      price: toPrice(p.price),
      image_url: imgs[0] || "/icons/icon-192.png",
      shop_name: shop.name,
      shop_phone: shop.phone,
      shop_city: shop.city,
      view_url: `/products/${p.id}`,
      delivery_fee: numericDeliveryFee,
    };
  });
}

function buildShops(answer: string, rows: Row[], question: string): AssistantShopCard[] {
  const ranked = rankRows(rows, question);
  const normalizedAnswer = normalizeText(answer);
  const preferred = normalizedAnswer
    ? ranked.filter((row) => {
        const shop = getRowShop(row);
        return !!shop && normalizedAnswer.includes(normalizeText(shop.name));
      })
    : [];

  const cards: AssistantShopCard[] = [];
  const seen = new Set<string>();

  for (const row of [...preferred, ...ranked]) {
    const shop = getRowShop(row);
    if (!shop || seen.has(shop.id)) continue;
    seen.add(shop.id);
    cards.push({
      id: shop.id,
      name: shop.name,
      city: shop.city,
      phone: shop.phone,
      description: shop.description,
    });
    if (cards.length >= MAX_SHOP_CARDS) break;
  }

  return cards;
}

export async function queryAssistant(
  question: string,
  deliveryZone: DeliveryZone
): Promise<AssistantResponse> {
  const lang = detectLanguageFromText(question);
  const supabase = createServiceClient();

  const { data: products, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
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

  const rows = (products as unknown as Row[]).filter((row) => getRowShop(row) !== null);
  if (!rows.length) {
    return {
      answer: fallbackMessage(lang),
      language: lang,
      products: [],
      shops: [],
    };
  }

  const rankedRows = rankRows(rows, question);
  const contextRows = (rankedRows.length ? rankedRows : rows).slice(0, MAX_CONTEXT_ROWS);
  const ctx = buildCatalogContext(contextRows, deliveryZone);

  const system = `You are Misrak Shemeta's Shop Assistant for Eastern Ethiopia.
Buyer zone: ${deliveryZone}. Reply ONLY in ${languageLabel(lang)}.
Use ONLY the facts in SHOP_DIRECTORY and PRODUCT_CATALOG.
Never invent prices, stock, phone numbers, delivery fees, shop names, cities, or product availability.
If a fact is missing from the catalog, say it is not available.
If the user asks about shops, recommend the most relevant shops and mention city and phone.
If the user asks about products, recommend the most relevant products and include price (ETB), stock, shop, phone, and delivery to ${deliveryZone}.
If there is no close match, say so clearly and then offer the closest options from the catalog.
Keep the answer concise and helpful.

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
    const answer = result.response.text().trim();
    if (!answer) throw new Error("empty response");

    const productCards = buildCards(answer, contextRows, deliveryZone, question);
    const shops = buildShops(answer, contextRows, question);

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
      products: buildCards("", contextRows, deliveryZone, question).slice(0, 3),
      shops: buildShops("", contextRows, question),
    };
  }
}
