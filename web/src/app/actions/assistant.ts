"use server";

import type { AssistantResponse, DeliveryZone } from "@/types";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { searchAssistantProducts } from "@/lib/data/marketplace";

function detectLanguage(text: string): "am" | "om" | "en" {
  if (/[\u1200-\u137F]/.test(text)) return "am";
  if (/\b(meeqa|barnoota|gabaa|bitaa|argadha|jira|danda)\b/i.test(text))
    return "om";
  return "en";
}

export async function queryAssistant(
  question: string,
  deliveryZone: DeliveryZone,
): Promise<AssistantResponse> {
  const language = detectLanguage(question);
  const products = await searchAssistantProducts(question, 4);

  const lines: string[] = [];
  if (language === "am") {
    lines.push(
      products.length
        ? "እነዚህ በስርዓቱ ውስጥ የተገኙ ተመሳሳይ ምርቶች ናቸው።"
        : "በአሁኑ ጊዜ ተመሳሳይ ምርት አልተገኘም።",
    );
  } else if (language === "om") {
    lines.push(
      products.length
        ? "Kunoo omishaalee walfakkaatan kanneen sirnicha keessatti argaman."
        : "Ammaaf omisha walfakkaataa hin arganne.",
    );
  } else {
    lines.push(
      products.length
        ? "Here are a few matching items currently available in the marketplace."
        : "I could not find a close match in the live marketplace yet.",
    );
  }

  const richProducts = products.map((p) => {
    const shop = p.shop!;
    const route = calculateDeliveryFee(shop.city, deliveryZone);
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      image_url: p.images[0] ?? "",
      shop_name: shop.name,
      shop_phone: shop.phone,
      shop_city: shop.city,
      view_url: `/products/${p.id}`,
      delivery_fee: route.fee,
    };
  });

  return {
    answer: lines.join(" "),
    language,
    products: richProducts,
    shops: [],
  };
}
