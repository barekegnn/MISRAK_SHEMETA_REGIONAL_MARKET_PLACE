"use client";

import Link from "next/link";
import { Phone } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatEtb } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import type { OrderItemRow, OrderStatus } from "@/types";

const STEPS: OrderStatus[] = [
  "PENDING",
  "PAID_ESCROW",
  "DISPATCHED",
  "COMPLETED",
];

export function OrderDetail({
  order,
}: {
  order: {
    id: string;
    status: OrderStatus;
    total: number | string;
    subtotal: number | string;
    delivery_fee: number | string;
    otp: string;
    items: OrderItemRow[];
    shops: { name: string; phone: string; city: string } | null;
  };
}) {
  const { t } = useLocale();
  const st = order.status;
  const idx = STEPS.indexOf(st === "FAILED" || st === "LOCKED" ? "PENDING" : st);

  return (
    <div className="space-y-6">
      <div>
        <Badge className="mb-2">{st}</Badge>
        <h1 className="font-mono text-xl font-bold text-brand-950">{order.id}</h1>
      </div>

      <div>
        <h2 className="mb-2 text-sm font-semibold text-brand-800">
          {t("orders.timeline")}
        </h2>
        <ol className="flex flex-wrap gap-2">
          {STEPS.map((s, i) => (
            <li
              key={s}
              className={`rounded-full px-3 py-1 text-xs font-medium ${
                i <= idx
                  ? "bg-brand-500 text-white"
                  : "bg-brand-100 text-brand-600"
              }`}
            >
              {s.replace("_", " ")}
            </li>
          ))}
        </ol>
        {(st === "FAILED" || st === "LOCKED") && (
          <p className="mt-2 text-sm text-red-600">{st}</p>
        )}
      </div>

      <Card className="space-y-2 p-5">
        <div className="flex justify-between text-sm">
          <span>{t("cart.subtotal")}</span>
          <span>{formatEtb(Number(order.subtotal))}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t("cart.delivery")}</span>
          <span>{formatEtb(Number(order.delivery_fee))}</span>
        </div>
        <div className="flex justify-between border-t border-brand-100 pt-2 font-bold">
          <span>{t("cart.total")}</span>
          <span>{formatEtb(Number(order.total))}</span>
        </div>
      </Card>

      <div>
        <h2 className="text-sm font-semibold text-brand-800">{t("orders.otpLabel")}</h2>
        <p className="mt-2 text-4xl font-bold tracking-widest text-brand-900">
          {order.otp}
        </p>
      </div>

      <ul className="space-y-2">
        {order.items.map((it, i) => (
          <li key={i} className="rounded-xl border border-brand-100 bg-white px-4 py-3">
            <span className="font-medium">{it.product_name}</span>
            <span className="text-sm text-brand-600">
              {" "}
              ×{it.quantity} · {formatEtb(it.price_at_purchase)}
            </span>
          </li>
        ))}
      </ul>

      {order.shops && (
        <Card className="space-y-2 p-5">
          <h2 className="font-semibold">{order.shops.name}</h2>
          <p className="text-sm text-brand-600">{order.shops.city}</p>
          <a
            href={`tel:${order.shops.phone.replace(/\s/g, "")}`}
            className="inline-flex items-center gap-2 font-medium text-accent-700"
          >
            <Phone className="h-4 w-4" />
            {order.shops.phone}
          </a>
          <ButtonLink />
        </Card>
      )}
    </div>
  );
}

function ButtonLink() {
  const { t } = useLocale();
  return (
    <Link href="/products" className="text-sm font-semibold text-brand-600">
      ← {t("nav.browse")}
    </Link>
  );
}
