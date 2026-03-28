"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { OrderStatus } from "@/types";

type Props = {
  orderId: string;
  status: OrderStatus;
  canClaim: boolean;
  isAssigned: boolean;
};

export function RunnerOrderActions({ orderId, status, canClaim, isAssigned }: Props) {
  const router = useRouter();
  const [loadingAction, setLoadingAction] = useState<string | null>(null);
  const [otp, setOtp] = useState("");

  async function runAction(action: string, extra?: Record<string, unknown>) {
    setLoadingAction(action);
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update delivery.");
      }

      toast.success(payload.message ?? "Delivery updated.");
      setOtp("");
      if (action === "runner_complete") {
        router.push(`/runner/delivered/${orderId}`);
        return;
      }
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update delivery.");
    } finally {
      setLoadingAction(null);
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {canClaim ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void runAction("runner_claim")}
            disabled={loadingAction != null}
          >
            {loadingAction === "runner_claim" ? "Claiming..." : "Accept dispatch"}
          </Button>
        ) : null}

        {isAssigned && status === "PAID_ESCROW" ? (
          <Button
            type="button"
            size="sm"
            onClick={() => void runAction("runner_pickup")}
            disabled={loadingAction != null}
          >
            {loadingAction === "runner_pickup" ? "Confirming..." : "Confirm pickup"}
          </Button>
        ) : null}

        {isAssigned && status === "DISPATCHED" ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            onClick={() => void runAction("runner_release")}
            disabled={loadingAction != null}
          >
            {loadingAction === "runner_release" ? "Releasing..." : "Release job"}
          </Button>
        ) : null}

        {(isAssigned || canClaim) && status !== "COMPLETED" ? (
          <Button
            type="button"
            size="sm"
            variant="destructive"
            onClick={() => void runAction("runner_lock")}
            disabled={loadingAction != null}
          >
            {loadingAction === "runner_lock" ? "Locking..." : "Lock issue"}
          </Button>
        ) : null}
      </div>

      {isAssigned && status === "DISPATCHED" ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input
            value={otp}
            onChange={(event) => setOtp(event.target.value)}
            placeholder="Enter delivery OTP"
            className="sm:max-w-[12rem]"
          />
          <Button
            type="button"
            size="sm"
            onClick={() => void runAction("runner_complete", { otp })}
            disabled={loadingAction != null}
          >
            {loadingAction === "runner_complete" ? "Completing..." : "Complete delivery"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
