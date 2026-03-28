import type { DeliveryZone, ShopCity } from "@/types";

export interface DeliveryQuote {
  fee: number;
  estimatedTime: string;
}

/**
 * Eastern Triangle matrix — Requirement 11
 * Harar → Aweday 60; Dire_Dawa → Aweday 80; etc.
 */
const MATRIX: Record<ShopCity, Partial<Record<DeliveryZone, DeliveryQuote>>> = {
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
};

export function calculateDeliveryFee(
  shopCity: ShopCity,
  deliveryZone: DeliveryZone
): DeliveryQuote {
  const row = MATRIX[shopCity]?.[deliveryZone];
  if (!row) {
    throw new Error(`No route: ${shopCity} → ${deliveryZone}`);
  }
  return row;
}
