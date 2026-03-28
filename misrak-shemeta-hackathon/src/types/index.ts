export type DeliveryZone =
  | "Harar_City"
  | "Harar_Campus"
  | "Aweday_Town"
  | "Dire_Dawa_City"
  | "DDU"
  | "Haramaya_Town"
  | "Haramaya_Campus";

/** Matches extended `shop_city` enum: 001 + Aweday/Jigjiga + Haramaya/Jijiga migrations. */
export const SHOP_CITIES = [
  "Harar",
  "Dire_Dawa",
  "Aweday",
  "Jigjiga",
  "Haramaya",
  "Jijiga",
] as const;
export type ShopCity = (typeof SHOP_CITIES)[number];
export type LanguageCode = "en" | "am" | "om";
export type UserRole = "buyer" | "seller" | "runner" | "admin";

export type ProductCategory =
  | "Textbooks"
  | "Electronics"
  | "Clothing"
  | "Food & Beverages"
  | "Stationery"
  | "Accessories"
  | "Home & Living"
  | "Other";

export type OrderStatus =
  | "PENDING"
  | "PAID_ESCROW"
  | "DISPATCHED"
  | "COMPLETED"
  | "FAILED"
  | "LOCKED";

export interface UserRow {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  delivery_zone: DeliveryZone | null;
  language: LanguageCode;
  phone: string | null;
  created_at: string;
  updated_at?: string;
}

export interface ShopRow {
  id: string;
  owner_id: string;
  name: string;
  city: ShopCity;
  phone: string;
  description: string | null;
  balance: string | number;
  is_active: boolean;
  created_at: string;
}

export interface ProductRow {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: string | number;
  stock: number;
  category: ProductCategory;
  images: string[];
  is_active: boolean;
  created_at: string;
  shops?: ShopRow | null;
}

export interface CartItemRow {
  product_id: string;
  shop_id: string;
  quantity: number;
  price_at_add: number;
}

export interface OrderItemRow {
  product_id: string;
  shop_id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
  shop_city: ShopCity;
}

export interface OrderRow {
  id: string;
  buyer_id: string;
  shop_id: string;
  items: OrderItemRow[];
  subtotal: string | number;
  delivery_fee: string | number;
  total: string | number;
  status: OrderStatus;
  otp: string;
  otp_attempts: number;
  checkout_batch_id: string | null;
  mpesa_checkout_request_id: string | null;
  mpesa_receipt: string | null;
  runner_id: string | null;
  created_at: string;
}

export interface AssistantProductCard {
  id: string;
  shop_id: string;
  name: string;
  price: number;
  image_url: string;
  shop_name: string;
  shop_phone: string;
  shop_city: ShopCity;
  view_url: string;
  delivery_fee?: number;
}

export interface AssistantShopCard {
  id: string;
  name: string;
  city: ShopCity;
  phone: string;
  description: string | null;
}

export interface AssistantResponse {
  answer: string;
  language: LanguageCode;
  products: AssistantProductCard[];
  shops: AssistantShopCard[];
}

/** Fixed demo rate Requirement 9.3.b */
export const ETB_TO_KES = 0.65;
