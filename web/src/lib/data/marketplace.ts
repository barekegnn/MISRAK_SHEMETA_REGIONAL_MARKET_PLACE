import "server-only";

import { cache } from "react";
import type {
  BuyerTrackingOrder,
  DeliveryZone,
  Language,
  Order,
  OrderItem,
  OrderStatus,
  PaymentProvider,
  Product,
  ProductCategory,
  Shop,
  ShopCategory,
  ShopCity,
  TrackingStep,
  TrackingStepId,
  User,
  UserRole,
} from "@/types";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { createServerSupabaseClient } from "@/lib/supabase/server";

type Row = Record<string, unknown>;

const ACTIVE_ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID_ESCROW",
  "DISPATCHED",
  "LOCKED",
];

const TRACKABLE_ORDER_STATUSES: OrderStatus[] = [
  "DISPATCHED",
  "COMPLETED",
  "FAILED",
  "LOCKED",
];

const TRACKING_STEP_ORDER: TrackingStepId[] = [
  "PENDING",
  "PAID_ESCROW",
  "DISPATCHED",
  "COMPLETED",
];

const TRACKING_STEP_DETAILS: Record<
  TrackingStepId,
  {
    label: string;
    description: string;
  }
> = {
  PENDING: {
    label: "Order received",
    description: "Your order has been placed and is waiting for payment approval.",
  },
  PAID_ESCROW: {
    label: "Paid in escrow",
    description: "Payment is secured and the shop is preparing your items for handoff.",
  },
  DISPATCHED: {
    label: "Shipment dispatched",
    description: "The package has left the shop and is moving toward your delivery zone.",
  },
  COMPLETED: {
    label: "Delivered",
    description: "Delivery was confirmed and the order was completed successfully.",
  },
};

function asRow(value: unknown): Row {
  return value && typeof value === "object" ? (value as Row) : {};
}

function toString(value: unknown, fallback = "") {
  return typeof value === "string" ? value : fallback;
}

function toNullableString(value: unknown) {
  return typeof value === "string" && value.trim() ? value : null;
}

function toNumber(value: unknown, fallback = 0) {
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}

function toBoolean(value: unknown, fallback = false) {
  return typeof value === "boolean" ? value : fallback;
}

function toStringArray(value: unknown) {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  if (typeof value === "string" && value.trim()) {
    return [value];
  }
  return [] as string[];
}

function normalizeShopCity(value: unknown): ShopCity {
  const s = typeof value === "string" ? value.trim() : "";
  if (s === "Dire_Dawa" || s === "Dire Dawa") return "Dire_Dawa";
  if (s === "Haramaya") return "Haramaya";
  if (s === "Jijiga") return "Jijiga";
  if (s === "Harar") return "Harar";
  return "Harar";
}

function normalizeShopCategory(value: unknown, row: Row): ShopCategory {
  const allowed: ShopCategory[] = [
    "Books & Learning",
    "Electronics & Devices",
    "Essentials & Lifestyle",
  ];

  if (typeof value === "string" && allowed.includes(value as ShopCategory)) {
    return value as ShopCategory;
  }

  const haystack = `${toString(row.name)} ${toString(row.description)}`.toLowerCase();
  if (
    haystack.includes("book") ||
    haystack.includes("text") ||
    haystack.includes("study")
  ) {
    return "Books & Learning";
  }
  if (
    haystack.includes("electron") ||
    haystack.includes("phone") ||
    haystack.includes("laptop") ||
    haystack.includes("device")
  ) {
    return "Electronics & Devices";
  }

  return "Essentials & Lifestyle";
}

function normalizeDeliveryZone(value: unknown): DeliveryZone | null {
  if (typeof value !== "string" || !value.trim()) return null;
  return value as DeliveryZone;
}

function normalizeLanguage(value: unknown): Language {
  return value === "am" || value === "om" ? value : "en";
}

function normalizeUserRole(value: unknown): UserRole {
  return value === "seller" || value === "runner" || value === "admin" ? value : "buyer";
}

function normalizeCategory(value: unknown): ProductCategory {
  const allowed: ProductCategory[] = [
    "Textbooks",
    "Electronics",
    "Clothing",
    "Food & Beverages",
    "Stationery",
    "Accessories",
    "Home & Living",
    "Other",
  ];
  return typeof value === "string" && allowed.includes(value as ProductCategory)
    ? (value as ProductCategory)
    : "Other";
}

function normalizeStatus(value: unknown): OrderStatus {
  const allowed: OrderStatus[] = [
    "PENDING",
    "PAID_ESCROW",
    "DISPATCHED",
    "COMPLETED",
    "FAILED",
    "LOCKED",
  ];
  return typeof value === "string" && allowed.includes(value as OrderStatus)
    ? (value as OrderStatus)
    : "PENDING";
}

function sortByCreatedAtDesc<T extends { created_at: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    const left = Date.parse(a.created_at);
    const right = Date.parse(b.created_at);
    return (Number.isFinite(right) ? right : 0) - (Number.isFinite(left) ? left : 0);
  });
}

function getTrackingCurrentStepId(status: OrderStatus): TrackingStepId {
  if (status === "COMPLETED") return "COMPLETED";
  if (status === "DISPATCHED" || status === "FAILED" || status === "LOCKED") {
    return "DISPATCHED";
  }
  if (status === "PAID_ESCROW") return "PAID_ESCROW";
  return "PENDING";
}

function buildTrackingSteps(status: OrderStatus): TrackingStep[] {
  const currentStepId = getTrackingCurrentStepId(status);
  const currentIndex = TRACKING_STEP_ORDER.indexOf(currentStepId);

  return TRACKING_STEP_ORDER.map((id, index) => ({
    id,
    label: TRACKING_STEP_DETAILS[id].label,
    description: TRACKING_STEP_DETAILS[id].description,
    completed:
      currentStepId === "COMPLETED" ? index <= currentIndex : index < currentIndex,
    current: id === currentStepId,
  }));
}

const listTableRows = cache(async (table: string): Promise<Row[]> => {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase.from(table).select("*");
  if (error || !Array.isArray(data)) return [];

  return data.map(asRow);
});

export const getShops = cache(async (): Promise<Shop[]> => {
  const rows = await listTableRows("shops");

  const shops = rows.map((row, index) => ({
    id: toString(row.id, `shop-${index + 1}`),
    owner_id: toString(row.owner_id),
    name: toString(row.name, "Untitled shop"),
    category: normalizeShopCategory(row.category, row),
    city: normalizeShopCity(row.city),
    phone: toString(row.phone),
    description: toNullableString(row.description),
    balance: toNumber(row.balance),
    is_active: toBoolean(row.is_active, true),
    created_at: toString(row.created_at, new Date(0).toISOString()),
  }));

  return sortByCreatedAtDesc(shops);
});

export const getProducts = cache(async (): Promise<Product[]> => {
  const [rows, shops] = await Promise.all([listTableRows("products"), getShops()]);
  const shopsById = new Map(shops.map((shop) => [shop.id, shop]));

  const products = rows.map((row, index) => {
    const shopId = toString(row.shop_id);
    const shop = shopsById.get(shopId);

    return {
      id: toString(row.id, `product-${index + 1}`),
      shop_id: shopId,
      name: toString(row.name, "Untitled product"),
      description: toString(row.description),
      price: toNumber(row.price),
      stock: toNumber(row.stock),
      category: normalizeCategory(row.category),
      images: toStringArray(row.images).length
        ? toStringArray(row.images)
        : toStringArray(row.image_url),
      is_active: toBoolean(row.is_active, true),
      created_at: toString(row.created_at, new Date(0).toISOString()),
      shop,
    };
  });

  return sortByCreatedAtDesc(products);
});

export const getOrders = cache(async (): Promise<Order[]> => {
  const rows = await listTableRows("orders");

  const orders = rows.map((row, index) => ({
    id: toString(row.id, `order-${index + 1}`),
    buyer_id: toNullableString(row.buyer_id),
    shop_id: toNullableString(row.shop_id),
    seller_id: toNullableString(row.seller_id),
    runner_id: toNullableString(row.runner_id),
    status: normalizeStatus(row.status),
    total_amount: toNumber(row.total_amount),
    delivery_fee: toNumber(row.delivery_fee),
    delivery_zone: normalizeDeliveryZone(row.delivery_zone),
    customer_name:
      toNullableString(row.customer_name) ??
      toNullableString(row.buyer_name) ??
      toNullableString(row.full_name),
    customer_phone:
      toNullableString(row.customer_phone) ?? toNullableString(row.phone),
    customer_email: toNullableString(row.customer_email),
    payment_provider: normalizePaymentProvider(row.payment_provider),
    payment_reference: toNullableString(row.payment_reference),
    delivery_otp: toNullableString(row.delivery_otp),
    admin_note: toNullableString(row.admin_note),
    created_at: toString(row.created_at, new Date(0).toISOString()),
  }));

  return sortByCreatedAtDesc(orders);
});

export const getUsers = cache(async (): Promise<User[]> => {
  const rows = await listTableRows("users");

  const users = rows.map((row, index) => ({
    id: toString(row.id, `user-${index + 1}`),
    email: toString(row.email),
    full_name:
      toNullableString(row.full_name) ??
      toNullableString(row.name) ??
      toNullableString(toString(row.email).split("@")[0]),
    role: normalizeUserRole(row.role),
    delivery_zone: normalizeDeliveryZone(row.delivery_zone),
    language: normalizeLanguage(row.language),
    phone: toNullableString(row.phone),
    created_at: toString(row.created_at, new Date(0).toISOString()),
  }));

  return sortByCreatedAtDesc(users);
});

export async function getMarketplaceStats() {
  const [products, shops, orders] = await Promise.all([
    getProducts(),
    getShops(),
    getOrders(),
  ]);

  const buyers = new Set(
    orders.map((order) => order.buyer_id).filter((value): value is string => Boolean(value)),
  );

  return {
    products: products.filter((product) => product.is_active).length,
    shops: shops.filter((shop) => shop.is_active).length,
    buyers: buyers.size,
  };
}

export async function getHomeCatalog() {
  const products = (await getProducts()).filter((product) => product.is_active);
  const featured = products.slice(0, 6);
  const electronics = products.filter((product) => product.category === "Electronics");
  const books = products.filter((product) => product.category === "Textbooks");

  return {
    featured,
    electronics: electronics.length ? electronics : featured,
    books: books.length ? books : featured,
  };
}

export async function getFilteredProducts(params: {
  q?: string;
  category?: string;
  city?: string;
  minPrice?: number;
  maxPrice?: number;
}) {
  let products = (await getProducts()).filter((product) => product.is_active);

  if (params.q?.trim()) {
    const query = params.q.trim().toLowerCase();
    products = products.filter(
      (product) =>
        product.name.toLowerCase().includes(query) ||
        product.description.toLowerCase().includes(query) ||
        product.shop?.name.toLowerCase().includes(query),
    );
  }

  if (params.category && params.category !== "All") {
    products = products.filter((product) => product.category === params.category);
  }

  if (params.city) {
    products = products.filter((product) => product.shop?.city === params.city);
  }

  if (typeof params.minPrice === "number") {
    const minPrice = params.minPrice;
    products = products.filter((product) => product.price >= minPrice);
  }

  if (typeof params.maxPrice === "number") {
    const maxPrice = params.maxPrice;
    products = products.filter((product) => product.price <= maxPrice);
  }

  return products;
}

export async function getProductById(id: string) {
  const products = await getProducts();
  return products.find((product) => product.id === id) ?? null;
}

export async function searchAssistantProducts(question: string, limit = 4) {
  const query = question.trim().toLowerCase();
  const products = (await getProducts()).filter((product) => product.is_active);

  if (!query) return products.slice(0, limit);

  const ranked = products
    .map((product) => {
      let score = 0;
      if (product.name.toLowerCase().includes(query)) score += 5;
      if (product.description.toLowerCase().includes(query)) score += 3;
      if (product.category.toLowerCase().includes(query)) score += 2;
      if (product.shop?.name.toLowerCase().includes(query)) score += 2;

      const words = query.split(/\s+/).filter(Boolean);
      score += words.reduce((sum, word) => {
        let hits = 0;
        if (product.name.toLowerCase().includes(word)) hits += 2;
        if (product.description.toLowerCase().includes(word)) hits += 1;
        if (product.shop?.name.toLowerCase().includes(word)) hits += 1;
        return sum + hits;
      }, 0);

      return { product, score };
    })
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score || b.product.stock - a.product.stock);

  return (ranked.length ? ranked.map((entry) => entry.product) : products).slice(0, limit);
}

export async function getBuyerDashboardData(userId: string) {
  const [orders, products] = await Promise.all([getOrders(), getProducts()]);
  const buyerOrders = orders.filter((order) => order.buyer_id === userId);
  const activeOrders = buyerOrders.filter((order) =>
    ACTIVE_ORDER_STATUSES.includes(order.status),
  );
  const completedOrders = buyerOrders.filter((order) => order.status === "COMPLETED");

  return {
    orders: buyerOrders,
    activeOrders,
    completedOrders,
    totalSpent: completedOrders.reduce((sum, order) => sum + order.total_amount, 0),
    suggestions: products.filter((product) => product.is_active).slice(0, 4),
  };
}

export async function getSellerDashboardData(userId: string) {
  const [shops, products, orders] = await Promise.all([
    getShops(),
    getProducts(),
    getOrders(),
  ]);

  const sellerShops = shops.filter((shop) => shop.owner_id === userId);
  const shopIds = new Set(sellerShops.map((shop) => shop.id));
  const sellerProducts = products.filter((product) => shopIds.has(product.shop_id));
  const sellerOrders = orders.filter(
    (order) => order.seller_id === userId || (order.shop_id ? shopIds.has(order.shop_id) : false),
  );

  return {
    shops: sellerShops,
    products: sellerProducts,
    orders: sellerOrders,
    openOrders: sellerOrders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
    dispatchReadyOrders: sellerOrders.filter((order) => order.status === "PAID_ESCROW"),
    blockedOrders: sellerOrders.filter((order) => order.status === "LOCKED"),
    lowStockProducts: sellerProducts.filter(
      (product) => product.stock > 0 && product.stock <= 5,
    ),
    completedRevenue: sellerOrders
      .filter((order) => order.status === "COMPLETED")
      .reduce((sum, order) => sum + order.total_amount, 0),
  };
}

export async function getRunnerDashboardData(
  userId: string,
  deliveryZone: DeliveryZone | null,
) {
  const orders = await getOrders();
  const directlyAssigned = orders.filter((order) => order.runner_id === userId);
  const zoneQueue = orders.filter(
    (order) =>
      order.runner_id == null &&
      order.status === "DISPATCHED" &&
      deliveryZone != null &&
      order.delivery_zone === deliveryZone,
  );
  const ordersById = new Map(
    [...directlyAssigned, ...zoneQueue].map((order) => [order.id, order]),
  );
  const assignedOrders = Array.from(ordersById.values());

  return {
    orders: assignedOrders,
    availableOrders: zoneQueue,
    assignedOrders: directlyAssigned.filter((order) => order.status !== "COMPLETED"),
    activeDeliveries: directlyAssigned.filter((order) => order.status === "DISPATCHED"),
    completedDeliveries: assignedOrders.filter((order) => order.status === "COMPLETED"),
    readyForPickup: directlyAssigned.filter((order) => order.status === "PAID_ESCROW"),
    blockedDeliveries: directlyAssigned.filter((order) => order.status === "LOCKED"),
    zones: Array.from(
      new Set(
        assignedOrders
          .map((order) => order.delivery_zone)
          .filter((value): value is DeliveryZone => value != null),
      ),
    ),
  };
}

export async function getAdminDashboardData() {
  const [shops, products, orders, users] = await Promise.all([
    getShops(),
    getProducts(),
    getOrders(),
    getUsers(),
  ]);

  return {
    shops,
    products,
    orders,
    users,
    liveOrders: orders.filter((order) => ACTIVE_ORDER_STATUSES.includes(order.status)),
    completedOrders: orders.filter((order) => order.status === "COMPLETED"),
    recentShops: shops.slice(0, 5),
    recentProducts: products.slice(0, 5),
    inactiveShops: shops.filter((shop) => !shop.is_active),
    inactiveProducts: products.filter((product) => !product.is_active),
    blockedOrders: orders.filter((order) => order.status === "LOCKED"),
    openRunnerQueue: orders.filter(
      (order) => order.status === "DISPATCHED" && order.runner_id == null,
    ),
    roleCounts: {
      buyers: users.filter((user) => user.role === "buyer").length,
      sellers: users.filter((user) => user.role === "seller").length,
      runners: users.filter((user) => user.role === "runner").length,
      admins: users.filter((user) => user.role === "admin").length,
    },
    uniqueBuyers: new Set(
      orders.map((order) => order.buyer_id).filter((value): value is string => Boolean(value)),
    ).size,
    activeSellers: new Set(
      shops.map((shop) => shop.owner_id).filter((value): value is string => Boolean(value)),
    ).size,
    assignedRunners: new Set(
      orders.map((order) => order.runner_id).filter((value): value is string => Boolean(value)),
    ).size,
    grossRevenue: orders
      .filter((order) => order.status === "COMPLETED")
      .reduce((sum, order) => sum + order.total_amount, 0),
  };
}

export async function getBuyerOrders(userId: string) {
  const orders = await getOrders();
  return orders.filter((order) => order.buyer_id === userId);
}

export async function getBuyerOrderById(orderId: string, userId: string) {
  const orders = await getBuyerOrders(userId);
  return orders.find((order) => order.id === orderId) ?? null;
}

export async function getBuyerOrderItems(orderId: string, userId: string): Promise<OrderItem[]> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [];

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) return [];

  return data.map((row) => ({
    order_id: toNullableString(row.order_id) ?? undefined,
    buyer_id: toNullableString(row.buyer_id),
    product_id: toString(row.product_id),
    shop_id: toString(row.shop_id),
    quantity: toNumber(row.quantity, 1),
    price_at_purchase: toNumber(row.price_at_purchase),
    product_name: toNullableString(row.product_name),
    shop_name: toNullableString(row.shop_name),
    image_url: toNullableString(row.image_url),
  }));
}

export async function getBuyerTrackingOrderById(
  orderId: string,
  userId: string,
): Promise<BuyerTrackingOrder | null> {
  const order = await getBuyerOrderById(orderId, userId);
  if (!order) {
    return null;
  }

  const [items, shops, users] = await Promise.all([
    getBuyerOrderItems(order.id, userId),
    getShops(),
    order.runner_id ? getUsers() : Promise.resolve([]),
  ]);

  const shopId = order.shop_id ?? items[0]?.shop_id ?? null;
  const shop = shopId ? shops.find((candidate) => candidate.id === shopId) ?? null : null;
  const runner = order.runner_id
    ? users.find((candidate) => candidate.id === order.runner_id) ?? null
    : null;
  const eta = shop && order.delivery_zone
    ? calculateDeliveryFee(shop.city, order.delivery_zone)
    : null;

  return {
    order,
    items,
    shop,
    runner,
    eta,
    steps: buildTrackingSteps(order.status),
    trackingAvailable: TRACKABLE_ORDER_STATUSES.includes(order.status),
    isInTransit: order.status === "DISPATCHED",
  };
}

export async function getOrderItemsByOrderIds(orderIds: string[]): Promise<Record<string, OrderItem[]>> {
  const uniqueIds = Array.from(new Set(orderIds.filter(Boolean)));
  if (!uniqueIds.length) {
    return {};
  }

  const supabase = await createServerSupabaseClient();
  if (!supabase) return {};

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .in("order_id", uniqueIds)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) {
    return {};
  }

  return data.reduce<Record<string, OrderItem[]>>((acc, row) => {
    const orderId = toString(row.order_id);
    if (!orderId) return acc;

    const item: OrderItem = {
      order_id: toNullableString(row.order_id) ?? undefined,
      buyer_id: toNullableString(row.buyer_id),
      product_id: toString(row.product_id),
      shop_id: toString(row.shop_id),
      quantity: toNumber(row.quantity, 1),
      price_at_purchase: toNumber(row.price_at_purchase),
      product_name: toNullableString(row.product_name),
      shop_name: toNullableString(row.shop_name),
      image_url: toNullableString(row.image_url),
    };

    const existing = acc[orderId] ?? [];
    existing.push(item);
    acc[orderId] = existing;
    return acc;
  }, {});
}

export async function getRunnerDirectory() {
  const users = await getUsers();
  return users.filter((user) => user.role === "runner");
}

export async function getRunnerOrderDetail(
  orderId: string,
  userId: string,
  deliveryZone: DeliveryZone | null,
) {
  const orders = await getOrders();
  const order = orders.find((candidate) => candidate.id === orderId) ?? null;
  if (!order) {
    return null;
  }

  const inZoneQueue =
    order.runner_id == null &&
    order.status === "DISPATCHED" &&
    deliveryZone != null &&
    order.delivery_zone === deliveryZone;
  const assignedToMe = order.runner_id === userId;

  if (!inZoneQueue && !assignedToMe) {
    return null;
  }

  const [itemsByOrderId, shops] = await Promise.all([
    getOrderItemsByOrderIds([orderId]),
    getShops(),
  ]);

  const items = itemsByOrderId[orderId] ?? [];
  const shopId = order.shop_id ?? items[0]?.shop_id ?? null;
  const shop = shopId ? shops.find((candidate) => candidate.id === shopId) ?? null : null;
  const routeEta =
    shop && order.delivery_zone ? calculateDeliveryFee(shop.city, order.delivery_zone) : null;

  return {
    order,
    items,
    shop,
    routeEta,
  };
}

function normalizePaymentProvider(value: unknown): PaymentProvider | null {
  return value === "chapa" || value === "mpesa" ? value : null;
}
