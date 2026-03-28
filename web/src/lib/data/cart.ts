import "server-only";

import { mapSupabaseUser } from "@/lib/auth/shared";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { sanitizeCartItems, mergeCartItems } from "@/lib/cart/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { getProducts } from "@/lib/data/marketplace";
import type {
  CartItem,
  DeliveryZone,
  Order,
  OrderItem,
  PaymentProvider,
} from "@/types";

type Row = Record<string, unknown>;

type CheckoutInput = {
  provider: PaymentProvider;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryZone: DeliveryZone;
  items?: CartItem[];
};

type SupabaseContext = {
  supabase: NonNullable<Awaited<ReturnType<typeof createServerSupabaseClient>>>;
  userId: string;
};

export type CheckoutResult = {
  orders: Order[];
};

export class CartDataError extends Error {
  status: number;

  constructor(message: string, status = 500) {
    super(message);
    this.name = "CartDataError";
    this.status = status;
  }
}

export async function getAccountCartForCurrentUser() {
  const context = await requireSupabaseUser();
  const rows = await listCartRows(context);
  return hydrateCartItems(rows);
}

export async function mergeAccountCartForCurrentUser(guestItems: CartItem[]) {
  const context = await requireSupabaseUser();
  const currentItems = await hydrateCartItems(await listCartRows(context));
  const mergedItems = mergeCartItems(currentItems, sanitizeCartItems(guestItems));

  await persistCartRows(context, mergedItems);
  return hydrateCartItems(await listCartRows(context));
}

export async function replaceAccountCartForCurrentUser(items: CartItem[]) {
  const context = await requireSupabaseUser();
  const nextItems = sanitizeCartItems(items);

  await persistCartRows(context, nextItems);
  return hydrateCartItems(await listCartRows(context));
}

export async function clearAccountCartForCurrentUser() {
  const context = await requireSupabaseUser();
  const { error } = await context.supabase
    .from("cart_items")
    .delete()
    .eq("user_id", context.userId);

  if (error) {
    throw new CartDataError(error.message);
  }

  return [] as CartItem[];
}

export async function createCheckoutOrdersForCurrentUser(input: CheckoutInput): Promise<CheckoutResult> {
  const context = await requireSupabaseUser();
  const sourceItems = sanitizeCartItems(
    (await getAccountCartForCurrentUser()).length
      ? await getAccountCartForCurrentUser()
      : input.items ?? [],
  );

  if (!sourceItems.length) {
    throw new CartDataError("Your account cart is empty.", 400);
  }

  if (!input.customerName.trim()) {
    throw new CartDataError("Customer name is required.", 400);
  }

  if (!input.customerPhone.trim()) {
    throw new CartDataError("Customer phone is required.", 400);
  }

  const groupedByShop = new Map<string, CartItem[]>();
  sourceItems.forEach((item) => {
    const key = item.shop_id || "unassigned";
    const group = groupedByShop.get(key) ?? [];
    group.push(item);
    groupedByShop.set(key, group);
  });

  const createdOrders: Order[] = [];

  for (const [shopId, items] of groupedByShop.entries()) {
    const firstProduct = items[0]?.product;
    const shop = firstProduct?.shop;
    const deliveryFee =
      shop?.city != null
        ? calculateDeliveryFee(shop.city, input.deliveryZone).fee
        : 0;
    const subtotal = items.reduce(
      (sum, item) => sum + item.price_at_add * item.quantity,
      0,
    );
    const paymentReference = buildPaymentReference(input.provider);
    const deliveryOtp = randomDigits(6);
    const totalAmount = subtotal + deliveryFee;

    const orderPayload = {
      buyer_id: context.userId,
      shop_id: shopId === "unassigned" ? null : shopId,
      seller_id: shop?.owner_id ?? null,
      status: "PAID_ESCROW",
      total_amount: totalAmount,
      delivery_fee: deliveryFee,
      delivery_zone: input.deliveryZone,
      customer_name: input.customerName.trim(),
      customer_phone: input.customerPhone.trim(),
      customer_email: input.customerEmail?.trim() ? input.customerEmail.trim() : null,
      delivery_otp: deliveryOtp,
      payment_provider: input.provider,
      payment_reference: paymentReference,
    };

    const { data: orderRow, error: orderError } = await context.supabase
      .from("orders")
      .insert(orderPayload)
      .select("*")
      .single();

    if (orderError || !orderRow) {
      throw new CartDataError(orderError?.message ?? "Failed to create checkout order.");
    }

    const normalizedOrder = normalizeOrder(orderRow);
    createdOrders.push(normalizedOrder);

    const orderItemsPayload = items.map((item) => ({
      order_id: normalizedOrder.id,
      buyer_id: context.userId,
      product_id: item.product_id,
      shop_id: item.shop_id,
      quantity: item.quantity,
      price_at_purchase: item.price_at_add,
      product_name: item.product?.name ?? "Marketplace item",
      shop_name: item.product?.shop?.name ?? shop?.name ?? null,
      image_url: item.product?.images[0] ?? null,
    }));

    const { error: itemsError } = await context.supabase
      .from("order_items")
      .insert(orderItemsPayload);

    if (itemsError) {
      throw new CartDataError(itemsError.message);
    }
  }

  await clearAccountCartForCurrentUser();
  return { orders: createdOrders };
}

export async function getBuyerOrderItems(orderId: string, userId: string) {
  const supabase = await createServerSupabaseClient();
  if (!supabase) return [] as OrderItem[];

  const { data, error } = await supabase
    .from("order_items")
    .select("*")
    .eq("order_id", orderId)
    .eq("buyer_id", userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) {
    return [];
  }

  return data.map((row) => normalizeOrderItem(row as Row));
}

async function requireSupabaseUser(): Promise<SupabaseContext> {
  const supabase = await createServerSupabaseClient();
  if (!supabase) {
    throw new CartDataError("Supabase is not configured for account cart sync.", 503);
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    throw new CartDataError("Sign in to use the cart.", 401);
  }

  const mapped = mapSupabaseUser(user);
  if (mapped.role !== "buyer") {
    throw new CartDataError(
      "Only buyer accounts can use the cart and checkout. Sellers fulfill orders from the merchant dashboard.",
      403,
    );
  }

  return { supabase, userId: user.id };
}

async function listCartRows(context: SupabaseContext) {
  const { data, error } = await context.supabase
    .from("cart_items")
    .select("*")
    .eq("user_id", context.userId)
    .order("created_at", { ascending: true });

  if (error || !Array.isArray(data)) {
    throw new CartDataError(error?.message ?? "Failed to load account cart.");
  }

  return data.map((row) => normalizeCartRow(row as Row));
}

async function persistCartRows(context: SupabaseContext, items: CartItem[]) {
  const normalizedItems = sanitizeCartItems(items);
  const currentRows = await listCartRows(context);
  const currentIds = new Set(currentRows.map((item) => item.product_id));
  const nextIds = new Set(normalizedItems.map((item) => item.product_id));

  if (normalizedItems.length) {
    const payload = normalizedItems.map((item) => ({
      user_id: context.userId,
      product_id: item.product_id,
      shop_id: item.shop_id,
      quantity: item.quantity,
      price_at_add: item.price_at_add,
    }));

    const { error } = await context.supabase
      .from("cart_items")
      .upsert(payload, { onConflict: "user_id,product_id" });

    if (error) {
      throw new CartDataError(error.message);
    }
  }

  const staleIds = Array.from(currentIds).filter((productId) => !nextIds.has(productId));
  if (staleIds.length) {
    const { error } = await context.supabase
      .from("cart_items")
      .delete()
      .eq("user_id", context.userId)
      .in("product_id", staleIds);

    if (error) {
      throw new CartDataError(error.message);
    }
  }

  if (!normalizedItems.length && currentRows.length) {
    const { error } = await context.supabase
      .from("cart_items")
      .delete()
      .eq("user_id", context.userId);

    if (error) {
      throw new CartDataError(error.message);
    }
  }
}

async function hydrateCartItems(items: CartItem[]) {
  const products = await getProducts();
  const productsById = new Map(products.map((product) => [product.id, product]));

  return items.map((item) => ({
    ...item,
    product: item.product ?? productsById.get(item.product_id),
  }));
}

function normalizeCartRow(row: Row): CartItem {
  return {
    product_id: toString(row.product_id),
    shop_id: toString(row.shop_id),
    quantity: toNumber(row.quantity, 1),
    price_at_add: toNumber(row.price_at_add),
  };
}

function normalizeOrder(row: Row): Order {
  return {
    id: toString(row.id),
    buyer_id: toNullableString(row.buyer_id),
    shop_id: toNullableString(row.shop_id),
    seller_id: toNullableString(row.seller_id),
    runner_id: toNullableString(row.runner_id),
    status: normalizeStatus(row.status),
    total_amount: toNumber(row.total_amount),
    delivery_fee: toNumber(row.delivery_fee),
    delivery_zone: normalizeDeliveryZone(row.delivery_zone),
    customer_name: toNullableString(row.customer_name),
    customer_phone: toNullableString(row.customer_phone),
    customer_email: toNullableString(row.customer_email),
    payment_provider: normalizePaymentProvider(row.payment_provider),
    payment_reference: toNullableString(row.payment_reference),
    delivery_otp: toNullableString(row.delivery_otp),
    created_at: toString(row.created_at, new Date().toISOString()),
  };
}

function normalizeOrderItem(row: Row): OrderItem {
  return {
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
}

function normalizeStatus(value: unknown): Order["status"] {
  const allowed = new Set<Order["status"]>([
    "PENDING",
    "PAID_ESCROW",
    "DISPATCHED",
    "COMPLETED",
    "FAILED",
    "LOCKED",
  ]);

  return typeof value === "string" && allowed.has(value as Order["status"])
    ? (value as Order["status"])
    : "PENDING";
}

function normalizeDeliveryZone(value: unknown): DeliveryZone | null {
  return typeof value === "string" && value.trim()
    ? (value as DeliveryZone)
    : null;
}

function normalizePaymentProvider(value: unknown): PaymentProvider | null {
  return value === "chapa" || value === "mpesa" ? value : null;
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

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function buildPaymentReference(provider: PaymentProvider) {
  return `${provider === "chapa" ? "CHAPA" : "MPESA"}-${randomDigits(10)}`;
}
