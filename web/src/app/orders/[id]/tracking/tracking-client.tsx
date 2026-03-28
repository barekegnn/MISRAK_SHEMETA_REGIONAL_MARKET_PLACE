"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import type { OrderStatus } from "@/types";
import { Button } from "@/components/ui/button";

const POLLING_INTERVAL_MS = 20000;

export function TrackingClient({
  status,
  refreshedAt,
  children,
}: {
  status: OrderStatus;
  refreshedAt: string;
  children: ReactNode;
}) {
  const router = useRouter();
  const shouldPoll = status === "DISPATCHED";

  useEffect(() => {
    if (!shouldPoll) {
      return;
    }

    const intervalId = window.setInterval(() => {
      router.refresh();
    }, POLLING_INTERVAL_MS);

    return () => window.clearInterval(intervalId);
  }, [router, shouldPoll]);

  return (
    <div className="mt-6 space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-[#1E1B4B]">{getRefreshTitle(status)}</p>
          <p className="mt-1 text-sm text-neutral-600">
            Last refreshed {formatDateTime(refreshedAt)}.
          </p>
        </div>
        <Button type="button" variant="outline" onClick={() => router.refresh()}>
          Refresh now
        </Button>
      </div>
      {children}
    </div>
  );
}

function getRefreshTitle(status: OrderStatus) {
  if (status === "DISPATCHED") {
    return "Auto-refresh is active every 20 seconds while your shipment is in transit.";
  }

  if (status === "COMPLETED" || status === "FAILED" || status === "LOCKED") {
    return "Tracking history is no longer auto-refreshing for this shipment state.";
  }

  return "Tracking will start refreshing automatically once the order is dispatched.";
}

function formatDateTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
