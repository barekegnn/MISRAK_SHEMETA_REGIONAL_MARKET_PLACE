"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getRunnerSummary,
  listRunnerOrders,
  validateRunnerOtp,
} from "@/app/actions/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useLocale } from "@/components/providers/locale-provider";
import type { OrderItemRow } from "@/types";

export default function RunnerPage() {
  const { t } = useLocale();
  const qc = useQueryClient();
  const [otpByOrder, setOtpByOrder] = useState<Record<string, string>>({});

  const { data: orders = [] } = useQuery({
    queryKey: ["runner-orders"],
    queryFn: () => listRunnerOrders(),
    refetchInterval: 10_000,
  });

  const { data: summary } = useQuery({
    queryKey: ["runner-summary"],
    queryFn: () => getRunnerSummary(),
    refetchInterval: 10_000,
  });

  return (
    <div className="space-y-8">
      <h1 className="font-display text-3xl font-bold">{t("runner.title")}</h1>
      <div className="grid gap-4 sm:grid-cols-2">
        <Card className="p-5">
          <p className="text-sm text-brand-600">{t("runner.completed")}</p>
          <p className="text-2xl font-bold">{summary?.completed ?? 0}</p>
        </Card>
        <Card className="p-5">
          <p className="text-sm text-brand-600">Volume (ETB)</p>
          <p className="text-2xl font-bold">{summary?.volumeEtb ?? 0}</p>
        </Card>
      </div>

      {!orders.length ? (
        <Card className="p-8 text-center text-brand-700">{t("runner.empty")}</Card>
      ) : (
        <ul className="space-y-4">
          {orders.map((o) => {
            const items = o.items as OrderItemRow[];
            return (
              <li key={o.id}>
                <Card className="space-y-3 p-5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-mono text-sm">{o.id.slice(0, 8)}…</span>
                    <Badge>{o.buyer_zone}</Badge>
                  </div>
                  <ul className="text-sm text-brand-800">
                    {items.map((it, i) => (
                      <li key={i}>
                        {it.product_name} ×{it.quantity}
                      </li>
                    ))}
                  </ul>
                  <p className="text-sm">
                    <span className="text-brand-600">Shop:</span> {o.shop.name} ·{" "}
                    <a className="text-accent-700" href={`tel:${o.shop.phone}`}>
                      {o.shop.phone}
                    </a>
                  </p>
                  <p className="text-xs text-brand-500">
                    {t("runner.otpAttempts")}: {o.otp_attempts}/3
                  </p>
                  {o.otp_attempts >= 3 ? (
                    <p className="text-sm font-medium text-red-600">Contact Admin</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      <Input
                        className="max-w-[200px] rounded-xl"
                        placeholder="OTP"
                        value={otpByOrder[o.id] ?? ""}
                        onChange={(e) =>
                          setOtpByOrder((s) => ({ ...s, [o.id]: e.target.value }))
                        }
                      />
                      <Button
                        className="rounded-xl"
                        onClick={async () => {
                          try {
                            await validateRunnerOtp(o.id, otpByOrder[o.id] ?? "");
                            toast.success("Delivery confirmed");
                            await qc.invalidateQueries({ queryKey: ["runner-orders"] });
                            await qc.invalidateQueries({ queryKey: ["runner-summary"] });
                          } catch (e) {
                            const msg = e instanceof Error ? e.message : "Error";
                            if (msg === "LOCKED")
                              toast.error("Contact Admin — order locked.");
                            else if (msg === "BAD_OTP") toast.error("Incorrect OTP");
                            else toast.error(msg);
                          }
                        }}
                      >
                        Submit
                      </Button>
                    </div>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
