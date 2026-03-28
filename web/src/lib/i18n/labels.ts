import type en from "@/locales/en.json";
import type {
  DeliveryZone,
  ProductCategory,
  ShopCategory,
  ShopCity,
  UserRole,
} from "@/types";

export type TFunction = (
  key: keyof typeof en,
  vars?: Record<string, string | number>,
) => string;

const PRODUCT_CAT_KEY: Record<ProductCategory, keyof typeof en> = {
  Textbooks: "prodCat_textbooks",
  Electronics: "prodCat_electronics",
  Clothing: "prodCat_clothing",
  "Food & Beverages": "prodCat_foodBeverages",
  Stationery: "prodCat_stationery",
  Accessories: "prodCat_accessories",
  "Home & Living": "prodCat_homeLiving",
  Other: "prodCat_other",
};

const SHOP_CAT_KEY: Record<ShopCategory, keyof typeof en> = {
  "Books & Learning": "shopCat_booksLearning",
  "Electronics & Devices": "shopCat_electronicsDevices",
  "Essentials & Lifestyle": "shopCat_essentialsLifestyle",
};

const ZONE_KEY: Record<DeliveryZone, keyof typeof en> = {
  Harar_City: "zone_Harar_City",
  Harar_Campus: "zone_Harar_Campus",
  Dire_Dawa_City: "zone_Dire_Dawa_City",
  DDU: "zone_DDU",
  Aweday_Town: "zone_Aweday_Town",
  Haramaya_Town: "zone_Haramaya_Town",
  Haramaya_Campus: "zone_Haramaya_Campus",
};

const CITY_KEY: Record<ShopCity, keyof typeof en> = {
  Harar: "city_Harar",
  Dire_Dawa: "city_Dire_Dawa",
  Haramaya: "city_Haramaya",
  Jijiga: "city_Jijiga",
};

const ROLE_KEY: Record<UserRole, keyof typeof en> = {
  buyer: "role_buyer",
  seller: "role_seller",
  runner: "role_runner",
  admin: "role_admin",
};

/** href -> translation key for workspace / role nav links */
const WORKSPACE_NAV_KEY: Record<string, keyof typeof en> = {
  "/admin": "nav_admin_overview",
  "/dashboard": "nav_buyer_overview",
  "/orders": "nav_buyer_orders",
  "/merchant": "nav_seller_dashboard",
  "/merchant/products": "nav_seller_products",
  "/merchant/orders": "nav_seller_orders",
  "/merchant/products/new": "nav_seller_new_product",
  "/account": "account",
  "/runner": "nav_runner_deliveries",
};

export function translateProductCategory(
  category: ProductCategory | "All",
  t: TFunction,
): string {
  if (category === "All") return t("all");
  return t(PRODUCT_CAT_KEY[category]);
}

export function translateShopCategory(
  category: ShopCategory,
  t: TFunction,
): string {
  return t(SHOP_CAT_KEY[category]);
}

export function translateDeliveryZone(zone: DeliveryZone, t: TFunction): string {
  return t(ZONE_KEY[zone]);
}

export function translateShopCity(
  city: ShopCity | "" | null,
  t: TFunction,
): string {
  if (!city) return t("city_all_label");
  return t(CITY_KEY[city]);
}

export function translateRole(role: UserRole, t: TFunction): string {
  return t(ROLE_KEY[role]);
}

export function translateWorkspaceNavLabel(href: string, t: TFunction): string {
  const key = WORKSPACE_NAV_KEY[href];
  return key ? t(key) : href;
}
