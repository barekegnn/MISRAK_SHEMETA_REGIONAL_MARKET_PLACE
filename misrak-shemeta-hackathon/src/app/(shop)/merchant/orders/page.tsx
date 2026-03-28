"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { listMerchantOrders, markDispatched } from "@/app/actions/orders";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatEtb } from "@/lib/utils";
import { toast } from "sonner";
import Link from "next/link";

export default function MerchantOrdersPage() {
  const qc = useQueryClient();
  const { data: rows = [], isPending } = useQuery({
    queryKey: ["merchant-orders"],
    queryFn: () => listMerchantOrders(),
  });

  if (isPending) return <p>Loading…</p>;

  return (
    <div className="space-y-4">
      <h1 className="font-display text-3xl font-bold">Merchant orders</h1>
      <ul className="space-y-3">
        {rows.map((o) => (
          <li key={o.id as string}>
            <Card className="flex flex-wrap items-center justify-between gap-3 p-4">
              <div>
                <p className="font-mono text-xs">{(o.id as string).slice(0, 8)}…</p>
                <Badge>{String(o.status)}</Badge>
              </div>
              <span className="font-semibold">{formatEtb(Number(o.total))}</span>
              {String(o.status) === "PAID_ESCROW" && (
                <Button
                  size="sm"
                  className="rounded-xl"
                  onClick={async () => {
                    try {
                      await markDispatched(o.id as string);
                      await qc.invalidateQueries({ queryKey: ["merchant-orders"] });
                      toast.success("Marked dispatched");
                    } catch (e) {
                      toast.error(e instanceof Error ? e.message : "Error");
                    }
                  }}
                >
                  Mark as Dispatched
                </Button>
              )}
              <Button asChild variant="ghost" size="sm">
                <Link href={`/orders/${o.id as string}`}>View</Link>
              </Button>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
