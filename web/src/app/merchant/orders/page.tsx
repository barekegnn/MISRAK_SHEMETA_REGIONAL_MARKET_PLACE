import {
  DashboardShell,
  EmptyStateCard,
  MetricCard,
  OrderStatusBadge,
  SectionCard,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { requireRole } from "@/lib/auth/server";
import { getOrderItemsByOrderIds, getSellerDashboardData } from "@/lib/data/marketplace";
import { SellerOrderWorkflowActions } from "./order-workflow-actions";

export default async function MerchantOrdersPage() {
  const user = await requireRole(["seller"]);
  const data = await getSellerDashboardData(user.id);
  const orderItemsByOrderId = await getOrderItemsByOrderIds(data.orders.map((order) => order.id));

  return (
    <DashboardShell
      eyebrow="Seller fulfillment"
      title="Shop orders"
      description="Move paid orders into dispatch, review line items, and flag exceptions before they block delivery."
      actions={
        <>
          <LinkButton href="/merchant/products" variant="outline">
            Open products
          </LinkButton>
          <LinkButton href="/merchant" variant="outline">
            Seller overview
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Open fulfillment"
          value={String(data.openOrders.length)}
          hint="Orders still moving through payment or dispatch."
        />
        <MetricCard
          label="Ready to dispatch"
          value={String(data.dispatchReadyOrders.length)}
          hint="Paid orders waiting on seller handoff."
        />
        <MetricCard
          label="Locked issues"
          value={String(data.blockedOrders.length)}
          hint="Orders needing seller or admin review."
        />
        <MetricCard
          label="Completed revenue"
          value={`${data.completedRevenue.toLocaleString()} ETB`}
          hint="Completed seller-side order value."
        />
      </div>

      <SectionCard
        title="Order queue"
        description="Monitor payments, dispatches, line items, and seller-side interventions for your catalog."
      >
        {data.orders.length ? (
          <div className="space-y-3">
            {data.orders.map((order) => (
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
                        <Badge variant="outline">
                          {order.payment_provider === "chapa" ? "Chapa" : "M-Pesa"}
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
        ) : (
          <EmptyStateCard
            title="No seller orders yet"
            description="Seller-side order history will appear here once buyers start purchasing your products."
            actionHref="/merchant/products"
            actionLabel="Manage products"
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
