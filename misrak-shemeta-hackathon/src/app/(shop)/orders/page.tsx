"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { listOrdersForBuyer } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatEtb } from "@/lib/utils";
import { useLocale } from "@/components/providers/locale-provider";
import { useAuth } from "@/components/providers/auth-provider";

export default function OrdersPage() {
  const { t } = useLocale();
  const { user, loading } = useAuth();
  const { data: rows = [], isPending } = useQuery({
    queryKey: ["orders-list", user?.id],
    queryFn: () => listOrdersForBuyer(),
    enabled: !!user,
  });

  if (loading) return <p className="text-brand-600">{t("common.loading")}</p>;

  if (!user) {
    return (
      <Card className="p-8 text-center">
        <p>{t("cart.signInToCheckout")}</p>
        <Button asChild className="mt-4 rounded-xl">
          <Link href="/auth">{t("auth.signIn")}</Link>
        </Button>
      </Card>
    );
  }

  if (isPending) return <p className="text-brand-600">{t("common.loading")}</p>;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-3xl font-bold">{t("orders.title")}</h1>
      {!rows.length ? (
        <Card className="p-8 text-center">{t("orders.empty")}</Card>
      ) : (
        <ul className="space-y-3">
          {rows.map((o) => (
            <li key={o.id}>
              <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
                <div>
                  <p className="font-mono text-sm text-brand-600">
                    {(o.id as string).slice(0, 8)}…
                  </p>
                  <p className="text-xs text-brand-500">
                    {(o.shops as { name?: string })?.name}
                  </p>
                </div>
                <Badge>{String(o.status)}</Badge>
                <span className="font-semibold">
                  {formatEtb(Number(o.total))}
                </span>
                <Button asChild size="sm" className="rounded-xl">
                  <Link href={`/orders/${o.id}`}>{t("orders.view")}</Link>
                </Button>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
