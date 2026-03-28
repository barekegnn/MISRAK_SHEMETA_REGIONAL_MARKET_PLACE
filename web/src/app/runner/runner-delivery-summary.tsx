import type { Order } from "@/types";
import { formatLabel } from "@/components/dashboard/dashboard-ui";

export function RunnerDeliverySummary({
  order,
  className = "",
}: {
  order: Order;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-emerald-100 bg-emerald-50/60 p-4 text-sm ${className}`}
    >
      <p className="text-xs font-semibold uppercase tracking-wide text-emerald-800">
        Delivery location
      </p>
      <ul className="mt-2 space-y-1.5 text-neutral-800">
        <li>
          <span className="text-neutral-500">Zone: </span>
          {order.delivery_zone ? formatLabel(order.delivery_zone) : "Zone not set"}
        </li>
        <li>
          <span className="text-neutral-500">Recipient: </span>
          {order.customer_name?.trim() || "Name pending"}
        </li>
        {order.customer_phone ? (
          <li>
            <span className="text-neutral-500">Phone: </span>
            <a href={`tel:${order.customer_phone}`} className="font-medium text-[#4F46E5] hover:underline">
              {order.customer_phone}
            </a>
          </li>
        ) : (
          <li className="text-neutral-500">Phone: not provided</li>
        )}
        {order.customer_email ? (
          <li>
            <span className="text-neutral-500">Email: </span>
            {order.customer_email}
          </li>
        ) : null}
      </ul>
      <p className="mt-3 text-xs text-neutral-600">
        Hand off in the buyer&apos;s delivery zone. Contact them if the drop point needs clarification.
      </p>
    </div>
  );
}
