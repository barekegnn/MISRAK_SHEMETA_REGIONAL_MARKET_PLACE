"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { LinkButton } from "@/components/ui/link-button";
import {
  formatDemoOrderDate,
  getDemoOrder,
  type DemoOrder,
} from "@/lib/demo-payments";

export function DemoOrderDetail({ orderId }: { orderId: string }) {
  const [order, setOrder] = useState<DemoOrder | null | undefined>(undefined);

  useEffect(() => {
    const loadOrder = () => setOrder(getDemoOrder(orderId));

    loadOrder();
    window.addEventListener("storage", loadOrder);

    return () => window.removeEventListener("storage", loadOrder);
  }, [orderId]);

  if (order === undefined) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-neutral-500">
          <Link href="/orders" className="hover:underline">
            ← Orders
          </Link>
        </p>
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-neutral-500">
            Loading order details...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!order) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-8">
        <p className="text-sm text-neutral-500">
          <Link href="/orders" className="hover:underline">
            ← Orders
          </Link>
        </p>
        <Card className="mt-6">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">Order not found</h1>
              <p className="mt-2 text-sm text-neutral-600">
                This browser does not have a saved sandbox checkout for {orderId}.
              </p>
            </div>
            <LinkButton href="/orders" className="bg-[#4F46E5]">
              Back to orders
            </LinkButton>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8">
      <p className="text-sm text-neutral-500">
        <Link href="/orders" className="hover:underline">
          ← Orders
        </Link>
      </p>

      <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1B4B]">Order {order.id}</h1>
          <p className="mt-1 text-sm text-neutral-600">
            {formatDemoOrderDate(order.createdAt)} · {order.providerLabel} sandbox
            payment
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge className="bg-indigo-100 text-indigo-900" variant="outline">
            Paid in escrow
          </Badge>
          <Badge variant="outline">{order.providerLabel}</Badge>
        </div>
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-[1.3fr_minmax(0,18rem)]">
        <Card>
          <CardContent className="space-y-6 p-6">
            <div>
              <p className="text-sm font-semibold text-[#1E1B4B]">Payment summary</p>
              <p className="mt-2 text-sm text-neutral-600">{order.paymentMessage}</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <InfoBlock label="Reference" value={order.reference} />
              <InfoBlock label="Transaction ID" value={order.transactionId} />
              <InfoBlock label="Customer" value={order.customerName} />
              <InfoBlock label="Phone" value={order.customerPhone} />
              <InfoBlock
                label="Email"
                value={order.customerEmail ?? "Not used for this payment flow"}
              />
              <InfoBlock
                label="Delivery zone"
                value={order.deliveryZone.replace(/_/g, " ")}
              />
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-[#1E1B4B]">Items</p>
              <div className="mt-3 space-y-3">
                {order.items.map((item) => (
                  <div
                    key={`${order.id}-${item.productId}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">{item.productName}</p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {item.shopName} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[#1E1B4B]">
                      {(item.unitPriceEtb * item.quantity).toLocaleString()} ETB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="space-y-4 p-6">
            <div>
              <p className="text-sm font-semibold text-[#1E1B4B]">Escrow total</p>
              <p className="mt-2 text-3xl font-bold text-[#1E1B4B]">
                {order.totalEtb.toLocaleString()} ETB
              </p>
              {order.totalKes != null ? (
                <p className="mt-1 text-sm text-neutral-500">
                  {order.totalKes.toLocaleString()} KES sandbox conversion
                </p>
              ) : null}
            </div>

            <Separator />

            <div className="space-y-2 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-neutral-600">Subtotal</span>
                <span>{order.subtotalEtb.toLocaleString()} ETB</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-neutral-600">Delivery</span>
                <span>{order.deliveryEtb.toLocaleString()} ETB</span>
              </div>
            </div>

            <Separator />

            <div>
              <p className="text-sm font-semibold text-[#1E1B4B]">Delivery OTP</p>
              <p className="mt-2 font-mono text-4xl font-bold tracking-[0.28em] text-[#4F46E5]">
                {order.deliveryOtp}
              </p>
              <p className="mt-2 text-xs text-neutral-500">
                Share this code only when the runner arrives with the order.
              </p>
            </div>

            <LinkButton href="/products" className="w-full bg-[#4F46E5]">
              Continue shopping
            </LinkButton>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-neutral-900">{value}</p>
    </div>
  );
}
