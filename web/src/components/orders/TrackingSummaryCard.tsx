import { Clock3, MapPin, ShieldCheck, Store, Truck } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { BuyerTrackingOrder, OrderStatus } from "@/types";
import {
  OrderStatusBadge,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const STATUS_COPY: Record<OrderStatus, string> = {
  PENDING: "Your order is registered and waiting for payment confirmation.",
  PAID_ESCROW: "Payment is secured in escrow and the shop is preparing the shipment.",
  DISPATCHED: "Your shipment is on the way. Keep your delivery OTP ready for handoff.",
  COMPLETED: "Delivery has been confirmed and the order is complete.",
  FAILED: "This shipment hit a delivery issue. Contact support if you still need help.",
  LOCKED: "Delivery confirmation is locked for review while the order is being checked.",
};

export function TrackingSummaryCard({ tracking }: { tracking: BuyerTrackingOrder }) {
  const { order, shop, runner, eta } = tracking;

  return (
    <Card className="border-neutral-200 bg-white shadow-sm">
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-xl text-[#1E1B4B]">Shipment summary</CardTitle>
            <CardDescription className="mt-1 text-sm text-neutral-600">
              Order {order.id}
            </CardDescription>
          </div>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="text-sm text-neutral-600">{STATUS_COPY[order.status]}</p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-3 sm:grid-cols-2">
          <InfoTile
            icon={MapPin}
            label="Destination zone"
            value={formatLabel(order.delivery_zone)}
          />
          <InfoTile
            icon={Clock3}
            label="Estimated delivery"
            value={eta?.estimatedTime ?? "ETA unavailable"}
            detail={
              eta ? `${eta.fee.toLocaleString()} ETB route fee baseline` : "Needs shop and zone"
            }
          />
          <InfoTile
            icon={Store}
            label="Shop"
            value={shop?.name ?? "Shop details unavailable"}
            detail={
              shop
                ? `${formatLabel(shop.city)}${shop.phone ? ` · ${shop.phone}` : ""}`
                : "We will show shop contact details once they are available."
            }
          />
          <InfoTile
            icon={Truck}
            label="Runner"
            value={runner?.full_name ?? "Assignment pending"}
            detail={
              runner?.phone ??
              (order.runner_id
                ? "Runner assigned without a phone number on file."
                : "A runner will appear here once pickup is confirmed.")
            }
          />
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 p-4">
          <div className="flex items-center gap-2 text-[#1E1B4B]">
            <ShieldCheck className="size-4" />
            <p className="text-sm font-semibold">Delivery OTP</p>
          </div>
          <p className="mt-3 font-mono text-4xl font-bold tracking-[0.22em] text-[#4F46E5]">
            {order.delivery_otp ?? "------"}
          </p>
          <p className="mt-2 text-xs text-neutral-600">
            Share this code only when the runner arrives with your order.
          </p>
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <StatTile
            label="Order total"
            value={`${order.total_amount.toLocaleString()} ETB`}
          />
          <StatTile
            label="Delivery fee"
            value={`${order.delivery_fee.toLocaleString()} ETB`}
          />
          <StatTile label="Created" value={formatDate(order.created_at)} />
        </div>
      </CardContent>
    </Card>
  );
}

function InfoTile({
  icon: Icon,
  label,
  value,
  detail,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  detail?: string;
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-neutral-50/80 p-4">
      <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-neutral-500">
        <Icon className="size-4" />
        <span>{label}</span>
      </div>
      <p className="mt-3 text-sm font-semibold text-[#1E1B4B]">{value}</p>
      {detail ? <p className="mt-1 text-xs text-neutral-500">{detail}</p> : null}
    </div>
  );
}

function StatTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-neutral-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-neutral-500">
        {label}
      </p>
      <p className="mt-2 text-sm font-semibold text-[#1E1B4B]">{value}</p>
    </div>
  );
}

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}
