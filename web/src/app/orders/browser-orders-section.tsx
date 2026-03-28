"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import {
  formatDemoOrderDate,
  listDemoOrders,
  type DemoOrder,
} from "@/lib/demo-payments";

export function BrowserOrdersSection() {
  const [orders, setOrders] = useState<DemoOrder[] | null>(null);

  useEffect(() => {
    const loadOrders = () => setOrders(listDemoOrders());

    loadOrders();
    window.addEventListener("storage", loadOrders);

    return () => window.removeEventListener("storage", loadOrders);
  }, []);

  return (
    <section className="mt-8">
      <div>
        <h2 className="text-xl font-bold text-[#1E1B4B]">Guest browser checkout history</h2>
        <p className="mt-2 text-sm text-neutral-600">
          Orders saved locally from the fallback checkout flow on this device.
        </p>
      </div>

      {orders === null ? (
        <Card className="mt-6">
          <CardContent className="py-12 text-center text-sm text-neutral-500">
            Loading saved checkout history...
          </CardContent>
        </Card>
      ) : null}

      {orders?.length === 0 ? (
        <Card className="mt-6 border-dashed border-neutral-300 bg-neutral-50">
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <p className="text-center text-sm text-neutral-500">
              No browser-saved fallback orders yet. Complete checkout to create one.
            </p>
            <LinkButton href="/checkout" variant="outline">
              Open checkout
            </LinkButton>
          </CardContent>
        </Card>
      ) : null}

      {orders?.length ? (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardContent className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge className="bg-indigo-100 text-indigo-900" variant="outline">
                      Paid in escrow
                    </Badge>
                    <Badge variant="outline">{order.providerLabel} sandbox</Badge>
                  </div>
                  <p className="mt-3 font-semibold text-[#1E1B4B]">{order.id}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {formatDemoOrderDate(order.createdAt)} · {order.items.length} item
                    {order.items.length === 1 ? "" : "s"} · Deliver to{" "}
                    {order.deliveryZone.replace(/_/g, " ")}
                  </p>
                  <p className="mt-2 text-sm text-neutral-500">{order.paymentMessage}</p>
                </div>

                <div className="flex flex-col gap-3 md:items-end">
                  <div className="text-left md:text-right">
                    <p className="text-sm text-neutral-500">Total</p>
                    <p className="text-lg font-bold text-[#1E1B4B]">
                      {order.totalEtb.toLocaleString()} ETB
                    </p>
                    {order.totalKes != null ? (
                      <p className="text-sm text-neutral-500">
                        {order.totalKes.toLocaleString()} KES sandbox amount
                      </p>
                    ) : null}
                  </div>
                  <LinkButton href={`/orders/${order.id}`} className="bg-[#4F46E5]">
                    View details
                  </LinkButton>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : null}
    </section>
  );
}
