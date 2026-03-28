import {
  DashboardShell,
  EmptyStateCard,
  MetricCard,
  OrderStatusBadge,
  SectionCard,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { EntityToggleButton } from "@/components/dashboard/entity-toggle-button";
import {
  getAdminDashboardData,
  getOrderItemsByOrderIds,
  getRunnerDirectory,
} from "@/lib/data/marketplace";
import { requireRole } from "@/lib/auth/server";
import { ResetDemoButton } from "./reset-demo-button";
import { AdminOrderControls } from "./admin-order-controls";

export default async function AdminPage() {
  await requireRole(["admin"]);
  const [data, runners] = await Promise.all([getAdminDashboardData(), getRunnerDirectory()]);
  const adminOrderWindow = data.orders.slice(0, 5);
  const orderItemsByOrderId = await getOrderItemsByOrderIds(
    adminOrderWindow.map((order) => order.id),
  );

  return (
    <DashboardShell
      eyebrow="Platform control"
      title="Admin dashboard"
      description="Monitor marketplace growth, fulfillment health, and the live catalog from one place."
      actions={
        <>
          <LinkButton href="/" variant="outline">
            Open homepage
          </LinkButton>
          <LinkButton href="/products" variant="outline">
            View storefront
          </LinkButton>
          <ResetDemoButton />
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Active products"
          value={String(data.products.filter((product) => product.is_active).length)}
          hint="Catalog items currently visible on the storefront."
        />
        <MetricCard
          label="Active shops"
          value={String(data.shops.filter((shop) => shop.is_active).length)}
          hint="Seller storefronts available to buyers."
        />
        <MetricCard
          label="Orders in progress"
          value={String(data.liveOrders.length)}
          hint="Orders still moving through payment or delivery."
        />
        <MetricCard
          label="Completed GMV"
          value={`${data.grossRevenue.toLocaleString()} ETB`}
          hint="Completed order value tracked by the frontend dashboard."
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Buying accounts"
          value={String(data.uniqueBuyers)}
          hint="Unique buyer IDs seen in orders."
        />
        <MetricCard
          label="Active sellers"
          value={String(data.activeSellers)}
          hint="Shop owners with storefront records."
        />
        <MetricCard
          label="Assigned runners"
          value={String(data.assignedRunners)}
          hint="Runner IDs currently attached to orders."
        />
        <MetricCard
          label="Open runner queue"
          value={String(data.openRunnerQueue.length)}
          hint="Dispatched orders waiting for a runner assignment."
        />
      </div>

      <SectionCard
        title="Order control surface"
        description="Live order oversight, runner assignment, and admin notes for the newest platform activity."
      >
        {adminOrderWindow.length ? (
          <div className="space-y-3">
            {adminOrderWindow.map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                    <OrderStatusBadge status={order.status} />
                  </div>
                  <p className="mt-1 text-sm text-neutral-600">
                    {order.total_amount.toLocaleString()} ETB ·{" "}
                    {formatLabel(order.delivery_zone)} ·{" "}
                    {order.customer_name ?? "Customer pending"}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Runner: {order.runner_id ?? "Unassigned"} · Seller: {order.seller_id ?? "Unknown"}
                  </p>
                </div>

                {orderItemsByOrderId[order.id]?.length ? (
                  <div className="grid gap-3 md:grid-cols-2">
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

                <AdminOrderControls
                  orderId={order.id}
                  status={order.status}
                  runnerId={order.runner_id}
                  adminNote={order.admin_note}
                  runners={runners}
                />
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No live orders yet"
            description="As buyers place orders, this panel will show the latest platform activity and intervention controls."
          />
        )}
      </SectionCard>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Shop moderation"
          description="Review storefront visibility and quickly hide or restore shops from the buyer marketplace."
        >
          {data.shops.length ? (
            <div className="space-y-3">
              {data.shops.slice(0, 6).map((shop) => (
                <div
                  key={shop.id}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{shop.name}</p>
                    <p className="mt-1 text-neutral-600">
                      {formatLabel(shop.city)} · {shop.phone || "Phone missing"}
                    </p>
                  </div>
                  <EntityToggleButton
                    endpoint={`/api/dashboard/shops/${shop.id}`}
                    isActive={shop.is_active}
                    activeLabel="Hide shop"
                    inactiveLabel="Restore shop"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No shops available"
              description="Create shop records in Supabase to populate the admin seller directory."
            />
          )}
        </SectionCard>

        <SectionCard
          title="Catalog moderation"
          description="Toggle product visibility without leaving the admin workspace."
        >
          {data.products.length ? (
            <div className="space-y-3">
              {data.products.slice(0, 6).map((product) => (
                <div
                  key={product.id}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 text-sm"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{product.name}</p>
                    <p className="mt-1 text-neutral-600">
                      {product.shop?.name ?? "Unassigned shop"} ·{" "}
                      {product.price.toLocaleString()} ETB
                    </p>
                  </div>
                  <EntityToggleButton
                    endpoint={`/api/dashboard/products/${product.id}`}
                    isActive={product.is_active}
                    activeLabel="Pause product"
                    inactiveLabel="Publish product"
                  />
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No products yet"
              description="Product publishing activity will appear here once sellers add inventory."
            />
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Role diagnostics"
        description="Quick read on which account types are present and who is currently participating in the platform."
      >
        {data.users.length ? (
          <div className="grid gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <MetricCard
                label="Buyer accounts"
                value={String(data.roleCounts.buyers)}
                hint="Users currently mapped as buyers."
              />
              <MetricCard
                label="Seller accounts"
                value={String(data.roleCounts.sellers)}
                hint="Users currently mapped as sellers."
              />
              <MetricCard
                label="Runner accounts"
                value={String(data.roleCounts.runners)}
                hint="Users currently mapped as runners."
              />
              <MetricCard
                label="Admin accounts"
                value={String(data.roleCounts.admins)}
                hint="Users currently mapped as admins."
              />
            </div>

            <div className="space-y-3">
              {data.users.slice(0, 8).map((user) => (
                <div
                  key={user.id}
                  className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 md:flex-row md:items-center md:justify-between"
                >
                  <div>
                    <p className="font-medium text-[#1E1B4B]">
                      {user.full_name ?? user.email}
                    </p>
                    <p className="mt-1 text-sm text-neutral-600">{user.email}</p>
                  </div>
                  <div className="text-sm text-neutral-500">
                    {user.role} · {formatLabel(user.delivery_zone, "No zone")}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyStateCard
            title="No user directory available"
            description="User diagnostics will populate once role-aware profile rows are readable to admin sessions."
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
