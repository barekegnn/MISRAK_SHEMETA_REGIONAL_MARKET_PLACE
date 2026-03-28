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
  Aweday: {
    Aweday_Town: { fee: 35, estimatedTime: "30–45 min" },
    Harar_City: { fee: 55, estimatedTime: "1–1.5 hours" },
    Harar_Campus: { fee: 55, estimatedTime: "1–1.5 hours" },
    Dire_Dawa_City: { fee: 70, estimatedTime: "1.5–2.5 hours" },
    DDU: { fee: 70, estimatedTime: "1.5–2.5 hours" },
    Haramaya_Town: { fee: 90, estimatedTime: "3–4 hours" },
    Haramaya_Campus: { fee: 90, estimatedTime: "3–4 hours" },
  },
  Jigjiga: {
    Harar_City: { fee: 220, estimatedTime: "6–8 hours" },
    Harar_Campus: { fee: 220, estimatedTime: "6–8 hours" },
    Aweday_Town: { fee: 190, estimatedTime: "5–7 hours" },
    Dire_Dawa_City: { fee: 200, estimatedTime: "6–8 hours" },
    DDU: { fee: 200, estimatedTime: "6–8 hours" },
    Haramaya_Town: { fee: 210, estimatedTime: "7–9 hours" },
    Haramaya_Campus: { fee: 210, estimatedTime: "7–9 hours" },
  },
  Haramaya: {
    Harar_City: { fee: 95, estimatedTime: "2–4 hours" },
    Harar_Campus: { fee: 95, estimatedTime: "2–4 hours" },
    Aweday_Town: { fee: 70, estimatedTime: "1–2 hours" },
    Haramaya_Town: { fee: 35, estimatedTime: "30–60 min" },
    Haramaya_Campus: { fee: 35, estimatedTime: "30–60 min" },
    Dire_Dawa_City: { fee: 140, estimatedTime: "4–5 hours" },
    DDU: { fee: 140, estimatedTime: "4–5 hours" },
  },
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
  deliveryZone: DeliveryZone
): DeliveryQuote {
  const row = MATRIX[shopCity]?.[deliveryZone];
  if (!row) {
    throw new Error(`No route: ${shopCity} → ${deliveryZone}`);
  }
  return row;
}
