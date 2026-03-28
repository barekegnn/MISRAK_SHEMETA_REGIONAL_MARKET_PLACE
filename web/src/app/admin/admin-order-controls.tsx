"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { OrderStatus, User } from "@/types";

const ORDER_STATUSES: OrderStatus[] = [
  "PENDING",
  "PAID_ESCROW",
  "DISPATCHED",
  "COMPLETED",
  "FAILED",
  "LOCKED",
];

type Props = {
  orderId: string;
  status: OrderStatus;
  runnerId: string | null;
  adminNote: string | null | undefined;
  runners: User[];
};

export function AdminOrderControls({
  orderId,
  status,
  runnerId,
  adminNote,
  runners,
}: Props) {
  const router = useRouter();
  const [nextStatus, setNextStatus] = useState<OrderStatus>(status);
  const [nextRunnerId, setNextRunnerId] = useState(runnerId ?? "__unassigned__");
  const [note, setNote] = useState(adminNote ?? "");
  const [saving, setSaving] = useState(false);

  async function saveChanges() {
    setSaving(true);
    try {
      const response = await fetch(`/api/dashboard/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "admin_update",
          status: nextStatus,
          runnerId: nextRunnerId,
          adminNote: note,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to update the order.");
      }

      toast.success(payload.message ?? "Order changes saved.");
      router.refresh();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update the order.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Status
          </label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={nextStatus}
            onChange={(event) => setNextStatus(event.target.value as OrderStatus)}
          >
            {ORDER_STATUSES.map((value) => (
              <option key={value} value={value}>
                {value.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
            Runner assignment
          </label>
          <select
            className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
            value={nextRunnerId}
            onChange={(event) => setNextRunnerId(event.target.value)}
          >
            <option value="__unassigned__">Unassigned runner</option>
            {runners.map((runner) => (
              <option key={runner.id} value={runner.id}>
                {(runner.full_name ?? runner.email).trim()} · {runner.delivery_zone ?? "No zone"}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-xs font-medium uppercase tracking-wide text-neutral-500">
          Admin note
        </label>
        <Textarea
          value={note}
          onChange={(event) => setNote(event.target.value)}
          placeholder="Explain why the order was locked, reassigned, or overridden."
          rows={3}
        />
      </div>

      <Button type="button" size="sm" onClick={() => void saveChanges()} disabled={saving}>
        {saving ? "Saving..." : "Save admin controls"}
      </Button>
    </div>
  );
}
