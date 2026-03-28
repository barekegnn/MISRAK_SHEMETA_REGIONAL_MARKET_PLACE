"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import {
  formatDemoOrderDate,
  getDemoOrder,
  type DemoOrder,
} from "@/lib/demo-payments";

export function DemoTrackingPage({ orderId }: { orderId: string }) {
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
            Loading shipment tracking...
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
              <h1 className="text-2xl font-bold text-[#1E1B4B]">Tracking not available</h1>
              <p className="mt-2 text-sm text-neutral-600">
                This browser does not have a saved sandbox order for {orderId}.
              </p>
            </div>
            <LinkButton href="/orders" className="bg-[#4F46E5] hover:bg-[#4338CA]">
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
        <Link href={`/orders/${order.id}`} className="hover:underline">
          ← Order details
        </Link>
      </p>
      <div className="mt-2">
        <h1 className="text-3xl font-bold text-[#1E1B4B]">Shipment tracking</h1>
        <p className="mt-2 text-sm text-neutral-600">
          Tracking starts after a sandbox order is marked as dispatched.
        </p>
      </div>

      <Card className="mt-6 border-neutral-200 bg-white shadow-sm">
        <CardContent className="space-y-6 p-6">
          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-indigo-100 text-indigo-900" variant="outline">
              Paid in escrow
            </Badge>
            <Badge variant="outline">{order.providerLabel} sandbox</Badge>
          </div>

          <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50/80 p-4">
            <p className="font-semibold text-[#1E1B4B]">Tracking becomes available after dispatch</p>
            <p className="mt-2 text-sm text-neutral-600">
              Your sandbox order is still waiting for shipment handoff. Once it is dispatched,
              this page will show the live shipment timeline.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <InfoTile label="Order" value={order.id} />
            <InfoTile label="Created" value={formatDemoOrderDate(order.createdAt)} />
            <InfoTile label="Delivery zone" value={order.deliveryZone.replace(/_/g, " ")} />
            <InfoTile label="Delivery OTP" value={order.deliveryOtp} mono />
          </div>

          <div className="flex flex-wrap gap-3">
            <LinkButton href={`/orders/${order.id}`} variant="outline">
              View order details
            </LinkButton>
            <LinkButton href="/products" className="bg-[#4F46E5] hover:bg-[#4338CA]">
              Continue shopping
            </LinkButton>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}

function InfoTile({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p
        className={`mt-2 text-sm font-semibold text-[#1E1B4B] ${
          mono ? "font-mono tracking-[0.18em]" : ""
        }`}
      >
        {value}
      </p>
    </div>
  );
}
