import {
  EmptyStateCard,
  OrderStatusBadge,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { PaymentProviderLogo } from "@/components/payments/payment-provider-logo";
import type { Order, OrderItem } from "@/types";
import { SellerOrderWorkflowActions } from "./orders/order-workflow-actions";

type Props = {
  orders: Order[];
  orderItemsByOrderId: Record<string, OrderItem[]>;
  emptyTitle: string;
  emptyDescription: string;
  emptyActionHref: string;
  emptyActionLabel: string;
};

export function SellerOrdersQueue({
  orders,
  orderItemsByOrderId,
  emptyTitle,
  emptyDescription,
  emptyActionHref,
  emptyActionLabel,
}: Props) {
  if (!orders.length) {
    return (
      <EmptyStateCard
        title={emptyTitle}
        description={emptyDescription}
        actionHref={emptyActionHref}
        actionLabel={emptyActionLabel}
      />
    );
  }

  return (
    <div className="space-y-3">
      {orders.map((order) => (
        <div
          key={order.id}
          className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4"
        >
          <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                <OrderStatusBadge status={order.status} />
                {order.payment_provider ? (
                  <Badge
                    variant="outline"
                    className="inline-flex items-center gap-1.5 border-neutral-200 py-1 pl-1.5 pr-2"
                  >
                    <PaymentProviderLogo
                      provider={order.payment_provider}
                      height={18}
                      className="max-h-[18px]"
                    />
                  </Badge>
                ) : null}
              </div>
              <p className="mt-2 text-sm text-neutral-600">
                {order.customer_name ?? "Customer pending"} ·{" "}
                {formatLabel(order.delivery_zone)}
              </p>
              <p className="mt-1 text-sm text-neutral-500">
                {order.total_amount.toLocaleString()} ETB ·{" "}
                {order.runner_id ? "Assigned runner" : "Open zone dispatch"}
              </p>
              {order.customer_phone ? (
                <a
                  href={`tel:${order.customer_phone}`}
                  className="mt-2 inline-block text-sm font-medium text-[#4F46E5] hover:underline"
                >
                  Call customer
                </a>
              ) : null}
            </div>

            <SellerOrderWorkflowActions orderId={order.id} status={order.status} />
          </div>

          {orderItemsByOrderId[order.id]?.length ? (
            <div className="grid gap-3 border-t border-neutral-200 pt-4 md:grid-cols-2">
              {orderItemsByOrderId[order.id].map((item) => (
                <div
                  key={`${order.id}-${item.product_id}`}
                  className="rounded-xl border border-neutral-200 bg-neutral-50 p-3"
                >
                  <p className="font-medium text-neutral-900">
                    {item.product_name ?? "Marketplace item"}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {item.shop_name ?? formatLabel(item.shop_id)} · Qty {item.quantity}
                  </p>
                  <p className="mt-1 text-sm text-neutral-500">
                    {(item.price_at_purchase * item.quantity).toLocaleString()} ETB
                  </p>
                </div>
              ))}
            </div>
          ) : null}

          {order.admin_note ? (
            <p className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
              Admin note: {order.admin_note}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}
