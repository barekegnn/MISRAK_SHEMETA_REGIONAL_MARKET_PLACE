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
import {
  getOrderItemsByOrderIds,
  getRunnerDashboardData,
} from "@/lib/data/marketplace";
import { requireRole } from "@/lib/auth/server";
import { RunnerOrderActions } from "./runner-order-actions";

export default async function RunnerPage() {
  const user = await requireRole(["runner"]);
  const data = await getRunnerDashboardData(user.id, user.delivery_zone);
  const orderItemsByOrderId = await getOrderItemsByOrderIds(data.orders.map((order) => order.id));

  return (
    <DashboardShell
      eyebrow="Delivery operations"
      title="Runner dashboard"
      description="Accept zone dispatches, confirm pickup for assigned jobs, and complete drop-offs with buyer OTP verification."
      actions={
        <>
          <LinkButton href="/" variant="outline">
            Open storefront
          </LinkButton>
          <LinkButton href="/products" variant="outline">
            Browse catalog
          </LinkButton>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Primary zone: {formatLabel(user.delivery_zone)}</Badge>
        <Badge variant="outline">Served zones: {Math.max(data.zones.length, 1)}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active deliveries"
          value={String(data.activeDeliveries.length)}
          hint="Orders currently out for fulfillment."
        />
        <MetricCard
          label="Completed deliveries"
          value={String(data.completedDeliveries.length)}
          hint="Orders already confirmed as delivered."
        />
        <MetricCard
          label="Open zone queue"
          value={String(data.availableOrders.length)}
          hint="Dispatched orders waiting for a runner to claim them."
        />
        <MetricCard
          label="Blocked deliveries"
          value={String(data.blockedDeliveries.length)}
          hint="Orders locked for manual follow-up."
        />
      </div>

      <SectionCard
        title="Available in your zone"
        description="Dispatched orders in your delivery zone that are ready for a runner to accept."
      >
        {data.availableOrders.length ? (
          <div className="space-y-3">
            {data.availableOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatLabel(order.delivery_zone)} ·{" "}
                      {order.customer_name ?? "Customer name pending"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      {order.total_amount.toLocaleString()} ETB
                    </p>
                  </div>
                  <RunnerOrderActions
                    orderId={order.id}
                    status={order.status}
                    canClaim
                    isAssigned={false}
                  />
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
                        <p className="mt-1 text-sm text-neutral-500">
                          {item.shop_name ?? formatLabel(item.shop_id)} · Qty {item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No open zone jobs right now"
            description="When sellers dispatch orders into your delivery zone, they will appear here for you to accept."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Assigned delivery queue"
        description="Orders already attached to this runner account, including pickup, in-transit, and locked jobs."
      >
        {data.assignedOrders.length ? (
          <div className="space-y-3">
            {data.assignedOrders.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4"
              >
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                      <OrderStatusBadge status={order.status} />
                      {order.status === "PAID_ESCROW" ? (
                        <Badge variant="outline">Pickup pending</Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {formatLabel(order.delivery_zone)} ·{" "}
                      {order.customer_name ?? "Customer name pending"}
                    </p>
                    <p className="mt-1 text-sm text-neutral-500">
                      OTP: {order.delivery_otp ?? "Available after dispatch"}
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
                  <RunnerOrderActions
                    orderId={order.id}
                    status={order.status}
                    canClaim={false}
                    isAssigned
                  />
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
                        <p className="mt-1 text-sm text-neutral-500">
                          {item.shop_name ?? formatLabel(item.shop_id)} · Qty {item.quantity}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No deliveries assigned yet"
            description="Accept a dispatched order from your zone queue or wait for an admin to assign one."
          />
        )}
      </SectionCard>

      <SectionCard
        title="Completed history"
        description="Recent runner completions confirmed by buyer OTP."
      >
        {data.completedDeliveries.length ? (
          <div className="space-y-3">
            {data.completedDeliveries.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {order.customer_name ?? "Customer name pending"} ·{" "}
                    {formatLabel(order.delivery_zone)}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No completed deliveries yet"
            description="Finished deliveries confirmed by OTP will appear here."
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
