"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/lib/supabase/client";
import { useLocale } from "@/components/providers/locale-provider";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatEtb } from "@/lib/utils";
import { useMemo } from "react";
import { Package, ShoppingBag, Store } from "lucide-react";

export default function MerchantDashboard() {
  const { t } = useLocale();
  const supabase = useMemo(() => createClient(), []);

  const { data: shop } = useQuery({
    queryKey: ["my-shop"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data } = await supabase
        .from("shops")
        .select("*")
        .eq("owner_id", u.user.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["merchant-counts", shop?.id],
    queryFn: async () => {
      if (!shop?.id) return { products: 0, pending: 0 };
      const [p, o] = await Promise.all([
        supabase
          .from("products")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .eq("is_active", true),
        supabase
          .from("orders")
          .select("id", { count: "exact", head: true })
          .eq("shop_id", shop.id)
          .in("status", ["PENDING", "PAID_ESCROW"]),
      ]);
      return { products: p.count ?? 0, pending: o.count ?? 0 };
    },
    enabled: !!shop?.id,
  });

  if (!shop) {
    return (
      <Card className="p-8 text-center">
        <Store className="mx-auto mb-4 h-12 w-12 text-brand-400" />
        <p className="mb-4 text-brand-800">Register your shop to start selling.</p>
        <Button asChild className="rounded-xl">
          <Link href="/merchant/register">{t("merchant.register")}</Link>
        </Button>
      </Card>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">{t("merchant.title")}</h1>
      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <p className="text-sm text-brand-600">{t("merchant.balance")}</p>
          <p className="mt-1 text-2xl font-bold text-brand-900">
            {formatEtb(Number(shop.balance))}
          </p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-brand-600">
            <Package className="h-4 w-4" />
            <span className="text-sm">{t("merchant.products")}</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{counts?.products ?? "—"}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center gap-2 text-brand-600">
            <ShoppingBag className="h-4 w-4" />
            <span className="text-sm">Awaiting action</span>
          </div>
          <p className="mt-1 text-2xl font-bold">{counts?.pending ?? "—"}</p>
        </Card>
      </div>
      <div className="flex flex-wrap gap-3">
        <Button asChild className="rounded-xl">
          <Link href="/merchant/products">{t("merchant.products")}</Link>
        </Button>
        <Button asChild variant="secondary" className="rounded-xl">
          <Link href="/merchant/orders">{t("merchant.orders")}</Link>
        </Button>
      </div>
    </div>
  );
}
