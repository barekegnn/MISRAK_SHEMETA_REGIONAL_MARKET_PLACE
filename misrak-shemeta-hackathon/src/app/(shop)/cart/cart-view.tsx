"use client";

import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Minus, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";
import {
  getCart,
  getCartPreview,
  removeFromCart,
  updateCartItem,
} from "@/app/actions/cart";
import type { DeliveryZone } from "@/types";
import { formatEtb } from "@/lib/utils";
import { toast } from "sonner";

export function CartView({ zone }: { zone: DeliveryZone }) {
  const { t } = useLocale();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: items = [], isPending } = useQuery({
    queryKey: ["cart", user?.id],
    queryFn: () => getCart(),
    enabled: !!user,
  });

  const { data: preview } = useQuery({
    queryKey: ["cart-preview", user?.id, zone, items],
    queryFn: () => getCartPreview(zone),
    enabled: !!user && items.length > 0,
  });

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p className="text-brand-800">{t("cart.signInToCheckout")}</p>
        <Button asChild className="mt-4 rounded-xl">
          <Link href="/auth">{t("auth.signIn")}</Link>
        </Button>
      </Card>
    );
  }

  if (isPending) return <p className="text-brand-600">{t("common.loading")}</p>;

  if (!items.length) {
    return (
      <Card className="p-8 text-center text-brand-800">
        {t("cart.empty")}
        <div className="mt-4">
          <Button asChild variant="secondary" className="rounded-xl">
            <Link href="/shops">{t("nav.browse")}</Link>
          </Button>
        </div>
      </Card>
    );
  }

  async function setQty(productId: string, q: number) {
    try {
      await updateCartItem(productId, q);
      await qc.invalidateQueries({ queryKey: ["cart"] });
    } catch {
      toast.error(t("common.error"));
    }
  }

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("cart.title")}</h1>
      <div className="space-y-3">
        {items.map((line) => (
          <Card key={line.product_id} className="flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <p className="font-medium text-brand-950">{line.product_id.slice(0, 8)}…</p>
              <p className="text-sm text-brand-600">
                {formatEtb(line.price_at_add)} × {line.quantity}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="icon"
                variant="secondary"
                type="button"
                onClick={() => void setQty(line.product_id, line.quantity - 1)}
              >
                <Minus className="h-4 w-4" />
              </Button>
              <span className="w-8 text-center font-semibold">{line.quantity}</span>
              <Button
                size="icon"
                variant="secondary"
                type="button"
                onClick={() => void setQty(line.product_id, line.quantity + 1)}
              >
                <Plus className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                type="button"
                className="text-red-600"
                onClick={async () => {
                  await removeFromCart(line.product_id);
                  await qc.invalidateQueries({ queryKey: ["cart"] });
                }}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </Card>
        ))}
      </div>
      { preview?.warnings?.length ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          {preview.warnings.join(" · ")}
        </div>
      ) : null}
      <Card className="space-y-2 p-5">
        <div className="flex justify-between text-sm">
          <span>{t("cart.subtotal")}</span>
          <span className="font-semibold">{formatEtb(preview?.subtotal ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t("cart.delivery")}</span>
          <span className="font-semibold">{formatEtb(preview?.deliveryFee ?? 0)}</span>
        </div>
        <div className="flex justify-between border-t border-brand-100 pt-2 text-lg font-bold">
          <span>{t("cart.total")}</span>
          <span>{formatEtb(preview?.total ?? 0)}</span>
        </div>
        <Button asChild className="mt-4 w-full rounded-2xl" size="lg">
          <Link href="/checkout">{t("cart.checkout")}</Link>
        </Button>
      </Card>
    </div>
  );
}
