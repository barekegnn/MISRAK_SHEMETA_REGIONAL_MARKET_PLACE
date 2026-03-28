"use client";

import type { CartItem } from "@/types";

export type DemoPaymentProvider = "chapa" | "mpesa";

export type DemoOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  unitPriceEtb: number;
  imageUrl: string | null;
  shopName: string;
};

export type DemoOrder = {
  id: string;
  status: "PAID_ESCROW";
  provider: DemoPaymentProvider;
  providerLabel: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  deliveryZone: string;
  createdAt: string;
  subtotalEtb: number;
  deliveryEtb: number;
  totalEtb: number;
  totalKes: number | null;
  reference: string;
  transactionId: string;
  paymentMessage: string;
  deliveryOtp: string;
  items: DemoOrderItem[];
};

type CreateDemoOrderInput = {
  provider: DemoPaymentProvider;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  deliveryZone: string;
  subtotalEtb: number;
  deliveryEtb: number;
  totalEtb: number;
  totalKes?: number | null;
  items: CartItem[];
};

const STORAGE_KEY = "misrak_demo_orders_v1";

export function listDemoOrders() {
  if (typeof window === "undefined") return [] as DemoOrder[];

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];

    const parsed = JSON.parse(raw) as DemoOrder[];
    if (!Array.isArray(parsed)) return [];

    return [...parsed].sort(
      (left, right) => Date.parse(right.createdAt) - Date.parse(left.createdAt),
    );
  } catch {
    return [];
  }
}

export function getDemoOrder(id: string) {
  return listDemoOrders().find((order) => order.id === id) ?? null;
}

export function clearDemoOrders() {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function createDemoOrder(input: CreateDemoOrderInput) {
  const providerLabel = formatDemoPaymentProvider(input.provider);
  const createdAt = new Date().toISOString();
  const order: DemoOrder = {
    id: `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
    status: "PAID_ESCROW",
    provider: input.provider,
    providerLabel,
    customerName: input.customerName.trim(),
    customerPhone: input.customerPhone.trim(),
    customerEmail: input.customerEmail?.trim() ? input.customerEmail.trim() : null,
    deliveryZone: input.deliveryZone,
    createdAt,
    subtotalEtb: input.subtotalEtb,
    deliveryEtb: input.deliveryEtb,
    totalEtb: input.totalEtb,
    totalKes: input.totalKes ?? null,
    reference: buildReference(input.provider),
    transactionId: buildTransactionId(input.provider),
    paymentMessage:
      input.provider === "chapa"
        ? "Sandbox Chapa checkout approved and funds are now held in escrow."
        : "Sandbox M-Pesa STK push approved and funds are now held in escrow.",
    deliveryOtp: randomDigits(6),
    items: input.items.map((item) => ({
      productId: item.product_id,
      productName: item.product?.name ?? "Marketplace item",
      quantity: item.quantity,
      unitPriceEtb: item.price_at_add,
      imageUrl: item.product?.images[0] ?? null,
      shopName: item.product?.shop?.name ?? "Misrak seller",
    })),
  };

  writeDemoOrders([order, ...listDemoOrders()]);
  return order;
}

export function formatDemoPaymentProvider(provider: DemoPaymentProvider) {
  return provider === "chapa" ? "Chapa" : "M-Pesa";
}

export function formatDemoOrderDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function writeDemoOrders(orders: DemoOrder[]) {
  if (typeof window === "undefined") return;

  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(orders));
  } catch {
    /* ignore */
  }
}

function randomDigits(length: number) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join("");
}

function buildReference(provider: DemoPaymentProvider) {
  return `${provider === "chapa" ? "CHAPA" : "MPESA"}-${randomDigits(10)}`;
}

function buildTransactionId(provider: DemoPaymentProvider) {
  return `${provider === "chapa" ? "TX" : "STK"}-${randomDigits(12)}`;
}
