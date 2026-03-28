"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import type { OrderStatus } from "@/types";

type Props = {
  orderId: string;
  status: OrderStatus;
};

export function SellerOrderWorkflowActions({ orderId, status }: Props) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);

  async function runAction(action: string) {
    setLoadingAction(action);
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update this order.");
      }

      toast.success(payload.message ?? "Order updated.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update this order.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "PAID_ESCROW" || status === "LOCKED") && (
        <Button
          type="button"
          size="sm"
          onClick={() => void runAction("seller_dispatch")}
          disabled={loadingAction != null}
        >
          {loadingAction === "seller_dispatch" ? "Dispatching..." : "Dispatch to runner queue"}
        </Button>
      )}

      {(status === "LOCKED" || status === "FAILED") && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void runAction("seller_resume")}
          disabled={loadingAction != null}
        >
          {loadingAction === "seller_resume" ? "Resuming..." : "Return to paid queue"}
        </Button>
      )}

      {status !== "FAILED" && status !== "COMPLETED" && (
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => void runAction("seller_lock")}
          disabled={loadingAction != null}
        >
          {loadingAction === "seller_lock" ? "Locking..." : "Lock issue"}
        </Button>
      )}

      {status !== "COMPLETED" && status !== "FAILED" && (
        <Button
          type="button"
          size="sm"
          variant="destructive"
          onClick={() => void runAction("seller_fail")}
          disabled={loadingAction != null}
        >
          {loadingAction === "seller_fail" ? "Failing..." : "Mark failed"}
        </Button>
      )}
    </div>
  );
}
