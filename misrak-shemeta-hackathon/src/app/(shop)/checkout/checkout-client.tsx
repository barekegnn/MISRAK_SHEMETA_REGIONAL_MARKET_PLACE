"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLocale } from "@/components/providers/locale-provider";
import {
  clearCartAfterSuccess,
  getCheckoutBatchStatus,
  initiateCheckout,
} from "@/app/actions/checkout";
import { getCartPreview } from "@/app/actions/cart";
import { formatEtb } from "@/lib/utils";
import type { DeliveryZone } from "@/types";
import Link from "next/link";

export function CheckoutClient({ zone }: { zone: DeliveryZone }) {
  const { t } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const sp = useSearchParams();
  const batchFromUrl = sp.get("batch");

  const [phone, setPhone] = useState("0912345678");
  const [pending, setPending] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(batchFromUrl);

  useEffect(() => {
    if (batchFromUrl) setBatchId(batchFromUrl);
  }, [batchFromUrl]);

  const { data: preview } = useQuery({
    queryKey: ["cart-preview", zone],
    queryFn: () => getCartPreview(zone),
  });

  async function pay() {
    setPending(true);
    try {
      const r = await initiateCheckout({ phone, deliveryZone: zone });
      if (!r.ok) {
        alert(r.error);
        return;
      }
      window.location.assign(r.checkoutUrl);
    } finally {
      setPending(false);
    }
  }

  const activeBatch = batchId;

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <div className="rounded-xl border border-amber-300 bg-amber-50 px-4 py-3 text-center text-sm font-medium text-amber-950">
        🧪 {t("checkout.testBanner")}
      </div>
      <h1 className="font-display text-3xl font-bold">{t("checkout.title")}</h1>

      <Card className="space-y-3 p-5">
        <h2 className="font-semibold">{t("checkout.orderSummary")}</h2>
        <div className="flex justify-between text-sm">
          <span>{t("cart.subtotal")}</span>
          <span>{formatEtb(preview?.subtotal ?? 0)}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>{t("cart.delivery")}</span>
          <span>{formatEtb(preview?.deliveryFee ?? 0)}</span>
        </div>
        <div className="flex justify-between font-bold">
          <span>{t("cart.total")}</span>
          <span>{formatEtb(preview?.total ?? 0)}</span>
        </div>
        <p className="text-xs text-brand-600">{t("checkout.chapaNote")}</p>
      </Card>

      {!activeBatch ? (
        <>
          <div>
            <Label htmlFor="phone">{t("checkout.phoneLabel")}</Label>
            <Input
              id="phone"
              className="mt-1 rounded-xl"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="09xxxxxxxx"
            />
          </div>
          <Button
            className="w-full rounded-2xl"
            size="lg"
            disabled={pending || !preview?.total}
            onClick={() => void pay()}
          >
            {pending ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              t("checkout.pay")
            )}
          </Button>
        </>
      ) : (
        <BatchWait
          batchId={activeBatch}
          onPaid={async (firstOrderId: string) => {
            await clearCartAfterSuccess();
            await qc.invalidateQueries({ queryKey: ["cart"] });
            router.replace(`/orders/${firstOrderId}`);
          }}
        />
      )}
    </div>
  );
}

function BatchWait({
  batchId,
  onPaid,
}: {
  batchId: string;
  onPaid: (firstOrderId: string) => void | Promise<void>;
}) {
  const { t } = useLocale();
  const handled = useRef(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const { data } = useQuery({
    queryKey: ["chapa-batch", batchId],
    queryFn: () => getCheckoutBatchStatus(batchId),
    refetchInterval: (q) =>
      q.state.data?.allPaid || q.state.data?.anyFailed ? false : 2000,
  });

  const firstOrderId = data?.orderIds[0];

  useEffect(() => {
    if (!data?.allPaid || handled.current || !firstOrderId) return;
    handled.current = true;
    void Promise.resolve(onPaidRef.current(firstOrderId));
  }, [data?.allPaid, firstOrderId]);

  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      <p className="font-medium text-brand-900">{t("checkout.chapaWaiting")}</p>
      {data?.anyFailed && (
        <p className="text-sm text-red-600">{t("checkout.chapaFailed")}</p>
      )}
      {firstOrderId && (
        <Button variant="secondary" asChild className="rounded-xl">
          <Link href={`/orders/${firstOrderId}`}>{t("orders.view")}</Link>
        </Button>
      )}
    </Card>
  );
}
