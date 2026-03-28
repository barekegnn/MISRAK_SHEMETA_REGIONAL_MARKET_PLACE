export type UserRole = "buyer" | "seller" | "runner" | "admin";

export type DeliveryZone =
  | "Harar_City"
  | "Harar_Campus"
  | "Aweday_Town"
  | "Haramaya_Town"
  | "Haramaya_Campus"
  | "Dire_Dawa_City"
  | "DDU";

export type ShopCity = "Harar" | "Dire_Dawa" | "Haramaya" | "Jijiga";

export type Language = "en" | "am" | "om";

export type ShopCategory =
  | "Books & Learning"
  | "Electronics & Devices"
  | "Essentials & Lifestyle";

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

export type PaymentProvider = "chapa" | "mpesa";

export interface User {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  delivery_zone: DeliveryZone | null;
  language: Language;
  phone: string | null;
  created_at: string;
}

export interface Shop {
  id: string;
  owner_id: string;
  name: string;
  category: ShopCategory;
  city: ShopCity;
  phone: string;
  description: string | null;
  balance: number;
  is_active: boolean;
  created_at: string;
}

export interface Product {
  id: string;
  shop_id: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: ProductCategory;
  images: string[];
  is_active: boolean;
  created_at: string;
  shop?: Shop;
}

export interface CartItem {
  product_id: string;
  shop_id: string;
  quantity: number;
  price_at_add: number;
  product?: Product;
}

export interface OrderItem {
  order_id?: string;
  buyer_id?: string | null;
  product_id: string;
  shop_id: string;
  quantity: number;
  price_at_purchase: number;
  product_name?: string | null;
  shop_name?: string | null;
  image_url?: string | null;
}

export interface Order {
  id: string;
  buyer_id: string | null;
  shop_id: string | null;
  seller_id: string | null;
  runner_id: string | null;
  status: OrderStatus;
  total_amount: number;
  delivery_fee: number;
  delivery_zone: DeliveryZone | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email?: string | null;
  payment_provider?: PaymentProvider | null;
  payment_reference?: string | null;
  delivery_otp: string | null;
  admin_note?: string | null;
  created_at: string;
}

export type TrackingStepId =
  | "PENDING"
  | "PAID_ESCROW"
  | "DISPATCHED"
  | "COMPLETED";

export interface TrackingStep {
  id: TrackingStepId;
  label: string;
  description: string;
  completed: boolean;
  current: boolean;
}

export interface BuyerTrackingOrder {
  order: Order;
  items: OrderItem[];
  shop: Shop | null;
  runner: User | null;
  eta: {
    fee: number;
    estimatedTime: string;
  } | null;
  steps: TrackingStep[];
  trackingAvailable: boolean;
  isInTransit: boolean;
}

export interface AssistantProductResult {
  id: string;
  name: string;
  price: number;
  image_url: string;
  shop_name: string;
  shop_phone: string;
  shop_city: ShopCity;
  view_url: string;
  delivery_fee?: number;
}

export interface AssistantShopResult {
  id: string;
  name: string;
  city: ShopCity;
  phone: string;
  description: string | null;
}

export interface AssistantResponse {
  answer: string;
  language: Language;
  products: AssistantProductResult[];
  shops: AssistantShopResult[];
}
