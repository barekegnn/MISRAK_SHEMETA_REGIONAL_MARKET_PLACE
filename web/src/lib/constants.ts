import type { DeliveryZone, ProductCategory, ShopCity } from "@/types";

export const PRODUCT_CATEGORIES: (ProductCategory | "All")[] = [
  "All",
  "Textbooks",
  "Electronics",
  "Clothing",
  "Food & Beverages",
  "Stationery",
  "Accessories",
  "Home & Living",
  "Other",
];

export const SHOP_CITIES: { value: ShopCity | ""; label: string }[] = [
  { value: "", label: "All cities" },
  { value: "Harar", label: "Harar" },
  { value: "Dire_Dawa", label: "Dire Dawa" },
  { value: "Haramaya", label: "Haramaya" },
  { value: "Jijiga", label: "Jijiga" },
];

export const DELIVERY_ZONES: { value: DeliveryZone; label: string }[] = [
  { value: "Harar_City", label: "Harar City" },
  { value: "Harar_Campus", label: "Harar Campus" },
  { value: "Dire_Dawa_City", label: "Dire Dawa City" },
  { value: "DDU", label: "Dire Dawa University (DDU)" },
  { value: "Aweday_Town", label: "Aweday Town" },
  { value: "Haramaya_Town", label: "Haramaya Town" },
  { value: "Haramaya_Campus", label: "Haramaya Campus" },
];
