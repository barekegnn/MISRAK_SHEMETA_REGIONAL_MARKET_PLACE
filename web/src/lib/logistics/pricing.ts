import type { DeliveryZone, ShopCity } from "@/types";

export interface DeliveryRoute {
  fee: number;
  estimatedTime: string;
}

const PRICING_MATRIX: Record<ShopCity, Record<DeliveryZone, DeliveryRoute>> = {
  Harar: {
    Harar_City: { fee: 40, estimatedTime: "30–60 min" },
    Harar_Campus: { fee: 40, estimatedTime: "30–60 min" },
    Aweday_Town: { fee: 60, estimatedTime: "1–2 hours" },
    Haramaya_Town: { fee: 100, estimatedTime: "3–4 hours" },
    Haramaya_Campus: { fee: 100, estimatedTime: "3–4 hours" },
    Dire_Dawa_City: { fee: 180, estimatedTime: "5–6 hours" },
    DDU: { fee: 180, estimatedTime: "5–6 hours" },
  },
  Dire_Dawa: {
    Dire_Dawa_City: { fee: 40, estimatedTime: "30–60 min" },
    DDU: { fee: 40, estimatedTime: "30–60 min" },
    Aweday_Town: { fee: 80, estimatedTime: "1–2 hours" },
    Haramaya_Town: { fee: 100, estimatedTime: "3–4 hours" },
    Haramaya_Campus: { fee: 100, estimatedTime: "3–4 hours" },
    Harar_City: { fee: 180, estimatedTime: "5–6 hours" },
    Harar_Campus: { fee: 180, estimatedTime: "5–6 hours" },
  },
  /** Shops based in Haramaya — local delivery to Haramaya zones; cross-city rates mirror regional corridor. */
  Haramaya: {
    Harar_City: { fee: 95, estimatedTime: "2–4 hours" },
    Harar_Campus: { fee: 95, estimatedTime: "2–4 hours" },
    Aweday_Town: { fee: 70, estimatedTime: "1–2 hours" },
    Haramaya_Town: { fee: 35, estimatedTime: "30–60 min" },
    Haramaya_Campus: { fee: 35, estimatedTime: "30–60 min" },
    Dire_Dawa_City: { fee: 140, estimatedTime: "4–5 hours" },
    DDU: { fee: 140, estimatedTime: "4–5 hours" },
  },
  /** Shops based in Jijiga — eastern hub; aligned with long cross-region legs to Harar/Haramaya. */
  Jijiga: {
    Harar_City: { fee: 200, estimatedTime: "6–8 hours" },
    Harar_Campus: { fee: 200, estimatedTime: "6–8 hours" },
    Aweday_Town: { fee: 110, estimatedTime: "3–4 hours" },
    Haramaya_Town: { fee: 150, estimatedTime: "4–6 hours" },
    Haramaya_Campus: { fee: 150, estimatedTime: "4–6 hours" },
    Dire_Dawa_City: { fee: 90, estimatedTime: "3–4 hours" },
    DDU: { fee: 90, estimatedTime: "3–4 hours" },
  },
};

export function calculateDeliveryFee(
  shopCity: ShopCity,
  deliveryZone: DeliveryZone,
): DeliveryRoute {
  return PRICING_MATRIX[shopCity][deliveryZone];
}
