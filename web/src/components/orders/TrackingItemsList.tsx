import { Package2 } from "lucide-react";
import type { OrderItem } from "@/types";
import { formatLabel } from "@/components/dashboard/dashboard-ui";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export function TrackingItemsList({ items }: { items: OrderItem[] }) {
  return (
    <Card className="border-neutral-200 bg-white shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl text-[#1E1B4B]">Items in this shipment</CardTitle>
        <CardDescription>
          {items.length} item{items.length === 1 ? "" : "s"} included in this order.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {items.length ? (
          <div className="space-y-3">
            {items.map((item) => (
              <div
                key={`${item.order_id ?? "order"}-${item.product_id}`}
                className="flex items-start justify-between gap-4 rounded-2xl border border-neutral-200 p-4"
              >
                <div className="flex min-w-0 items-start gap-3">
                  <div className="mt-0.5 rounded-xl bg-indigo-50 p-2 text-[#4F46E5]">
                    <Package2 className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate font-medium text-neutral-900">
                      {item.product_name ?? "Marketplace item"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {item.shop_name ?? formatLabel(item.shop_id)} · Qty {item.quantity}
                    </p>
                  </div>
                </div>
                <p className="shrink-0 text-sm font-semibold text-[#1E1B4B]">
                  {(item.price_at_purchase * item.quantity).toLocaleString()} ETB
                </p>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-neutral-500">
            Shipment item details will appear here as soon as the order is fully recorded.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
