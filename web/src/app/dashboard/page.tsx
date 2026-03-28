import { redirect } from "next/navigation";
import { ProductCard } from "@/components/products/ProductCard";
import {
  DashboardShell,
  MetricCard,
  OrderStatusBadge,
  SectionCard,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { getBuyerDashboardData } from "@/lib/data/marketplace";
import { getCurrentUser, requireUser } from "@/lib/auth/server";
import { getDashboardRoute } from "@/lib/auth/shared";

export default async function BuyerDashboardPage() {
  const sessionUser = await getCurrentUser();
  if (!sessionUser) {
    redirect("/auth");
  }
  if (sessionUser.role !== "buyer") {
    redirect(getDashboardRoute(sessionUser.role));
  }

  const user = await requireUser();
  const data = await getBuyerDashboardData(user.id);
  const firstName = user.full_name?.split(" ")[0] ?? user.email.split("@")[0];

  return (
    <DashboardShell
      eyebrow="Buyer workspace"
      title={`Welcome back, ${firstName}`}
      description="Track your orders, keep an eye on active deliveries, and jump back into the live marketplace."
      actions={
        <>
          <LinkButton href="/products" className="bg-[#4F46E5] hover:bg-[#4338CA]">
            Browse catalog
          </LinkButton>
          <LinkButton href="/orders" variant="outline">
            View order history
          </LinkButton>
          <LinkButton href="/account" variant="outline">
            Account
          </LinkButton>
        </>
      }
    >
      <div className="flex flex-wrap gap-2">
        <Badge variant="outline">Role: Buyer</Badge>
        <Badge variant="outline">Delivery zone: {formatLabel(user.delivery_zone)}</Badge>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Orders placed"
          value={String(data.orders.length)}
          hint="All purchases attached to your account."
        />
        <MetricCard
          label="Active deliveries"
          value={String(data.activeOrders.length)}
          hint="Orders currently waiting, paid, dispatched, or locked."
        />
        <MetricCard
          label="Completed orders"
          value={String(data.completedOrders.length)}
          hint="Successfully delivered purchases."
        />
        <MetricCard
          label="Total spent"
          value={`${data.totalSpent.toLocaleString()} ETB`}
          hint="Gross amount across completed purchases."
        />
      </div>

      <SectionCard
        title="Recent orders"
        description="Your latest order activity and fulfillment status."
        action={
          data.orders.length ? (
            <LinkButton href="/orders" variant="outline" size="sm">
              Open orders
            </LinkButton>
          ) : null
        }
      >
        {data.orders.length ? (
          <div className="space-y-3">
            {data.orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {order.total_amount.toLocaleString()} ETB
                    {" · "}
                    {formatLabel(order.delivery_zone)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={order.status} />
                  <LinkButton href={`/orders/${order.id}`} variant="outline" size="sm">
                    Details
                  </LinkButton>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-sm text-neutral-600">
            Your buyer dashboard will start filling up as soon as you place your first order.
          </p>
        )}
      </SectionCard>

      <SectionCard
        title="Recommended products"
        description="Fresh catalog items currently live on the marketplace."
      >
        {data.suggestions.length ? (
          <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
            {data.suggestions.map((product, index) => (
              <ProductCard key={product.id} product={product} index={index} />
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-sm text-neutral-600">
            No active products are available yet. Once sellers publish inventory, this dashboard will recommend items here.
          </p>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
