"use client";

import { useRouter } from "next/navigation";
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
import { ETB_TO_KES, type DeliveryZone } from "@/types";
import Link from "next/link";

export function CheckoutClient({ zone }: { zone: DeliveryZone }) {
  const { t } = useLocale();
  const router = useRouter();
  const qc = useQueryClient();
  const [phone, setPhone] = useState("254708374149");
  const [pending, setPending] = useState(false);
  const [batchId, setBatchId] = useState<string | null>(null);
  const [orderIds, setOrderIds] = useState<string[]>([]);

  const { data: preview } = useQuery({
    queryKey: ["cart-preview", zone],
    queryFn: () => getCartPreview(zone),
  });

  const kes =
    preview?.total != null
      ? Math.max(1, Math.ceil(preview.total * ETB_TO_KES))
      : 0;

  async function pay() {
    setPending(true);
    try {
      const r = await initiateCheckout({ phone, deliveryZone: zone });
      if (!r.ok) {
        alert(r.error);
        return;
      }
      setBatchId(r.batchId);
      setOrderIds(r.orderIds);
    } finally {
      setPending(false);
    }
  }

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
        <p className="text-xs text-brand-600">
          {t("checkout.etbToKes")}: ~{kes} KES
        </p>
      </Card>

      {!batchId ? (
        <>
          <div>
            <Label htmlFor="phone">{t("checkout.phoneLabel")}</Label>
            <Input
              id="phone"
              className="mt-1 rounded-xl"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
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
          batchId={batchId}
          firstOrderId={orderIds[0]}
          onPaid={async () => {
            await clearCartAfterSuccess();
            await qc.invalidateQueries({ queryKey: ["cart"] });
            router.push(`/orders/${orderIds[0]}`);
          }}
        />
      )}
    </div>
  );
}

function BatchWait({
  batchId,
  firstOrderId,
  onPaid,
}: {
  batchId: string;
  firstOrderId?: string;
  onPaid: () => void;
}) {
  const { t } = useLocale();
  const handled = useRef(false);
  const onPaidRef = useRef(onPaid);
  onPaidRef.current = onPaid;

  const { data } = useQuery({
    queryKey: ["mpesa-batch", batchId],
    queryFn: () => getCheckoutBatchStatus(batchId),
    refetchInterval: (q) =>
      q.state.data?.allPaid || q.state.data?.anyFailed ? false : 2000,
  });

  useEffect(() => {
    if (!data?.allPaid || handled.current) return;
    handled.current = true;
    void Promise.resolve(onPaidRef.current());
  }, [data?.allPaid]);

  return (
    <Card className="flex flex-col items-center gap-4 p-8 text-center">
      <Loader2 className="h-10 w-10 animate-spin text-brand-600" />
      <p className="font-medium text-brand-900">{t("checkout.waiting")}</p>
      {data?.anyFailed && (
        <p className="text-sm text-red-600">
          Payment failed — check M-PESA sandbox.
        </p>
      )}
      {firstOrderId && (
        <Button variant="secondary" asChild className="rounded-xl">
          <Link href={`/orders/${firstOrderId}`}>{t("orders.view")}</Link>
        </Button>
      )}
    </Card>
  );
}
