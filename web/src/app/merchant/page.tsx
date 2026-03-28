import {
  DashboardShell,
  MetricCard,
  OrderStatusBadge,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { getSellerDashboardData } from "@/lib/data/marketplace";
import { requireRole } from "@/lib/auth/server";

export default async function MerchantDashboardPage() {
  const user = await requireRole(["seller"]);
  const data = await getSellerDashboardData(user.id);

  return (
    <DashboardShell
      eyebrow="Seller workspace"
      title="Seller dashboard"
      description="Keep your catalog healthy, watch order flow, and manage the storefronts attached to your account."
      actions={
        <>
          <LinkButton href="/merchant/products/new" className="bg-[#4F46E5] hover:bg-[#4338CA]">
            New product
          </LinkButton>
          <LinkButton href="/merchant/products" variant="outline">
            Manage products
          </LinkButton>
          <LinkButton href="/merchant/orders" variant="outline">
            Review orders
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Storefronts"
          value={String(data.shops.length)}
          hint="Shops owned by this seller account."
        />
        <MetricCard
          label="Active products"
          value={String(data.products.filter((product) => product.is_active).length)}
          hint="Products currently published to the catalog."
        />
        <MetricCard
          label="Open orders"
          value={String(data.openOrders.length)}
          hint="Orders still moving through payment or fulfillment."
        />
        <MetricCard
          label="Ready to dispatch"
          value={String(data.dispatchReadyOrders.length)}
          hint="Paid orders waiting on seller handoff."
        />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Storefront overview"
          description="High-level view of the shops owned by this seller profile."
        >
          {data.shops.length ? (
            <div className="space-y-3">
              {data.shops.map((shop) => (
                <div
                  key={shop.id}
                  className="rounded-xl border border-neutral-200 p-4 text-sm"
                >
                  <p className="font-medium text-[#1E1B4B]">{shop.name}</p>
                  <p className="mt-1 text-neutral-600">
                    {shop.city.replace(/_/g, " ")} · {shop.phone || "Phone missing"}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-sm text-neutral-600">
              No shop record is linked to this seller yet. Add a `shops` row with your user ID as `owner_id` to activate the seller workspace.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Low stock attention"
          description="Products that are close to selling out."
          action={
            <LinkButton href="/merchant/products" variant="outline" size="sm">
              Open inventory
            </LinkButton>
          }
        >
          {data.lowStockProducts.length ? (
            <div className="space-y-3">
              {data.lowStockProducts.slice(0, 5).map((product) => (
                <div
                  key={product.id}
                  className="rounded-xl border border-neutral-200 p-4 text-sm"
                >
                  <p className="font-medium text-[#1E1B4B]">{product.name}</p>
                  <p className="mt-1 text-neutral-600">
                    {product.stock} left · {product.price.toLocaleString()} ETB
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-sm text-neutral-600">
              No products are running low right now.
            </p>
          )}
        </SectionCard>
      </div>

      <SectionCard
        title="Recent order activity"
        description="Latest seller-side fulfillment activity."
        action={
          <LinkButton href="/merchant/orders" variant="outline" size="sm">
            Open fulfillment
          </LinkButton>
        }
      >
        {data.orders.length ? (
          <div className="space-y-3">
            {data.orders.slice(0, 6).map((order) => (
              <div
                key={order.id}
                className="flex flex-col gap-3 rounded-xl border border-neutral-200 p-4 md:flex-row md:items-center md:justify-between"
              >
                <div>
                  <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                  <p className="mt-1 text-sm text-neutral-600">
                    {order.total_amount.toLocaleString()} ETB ·{" "}
                    {order.customer_name ?? "Customer pending"}
                  </p>
                </div>
                <OrderStatusBadge status={order.status} />
              </div>
            ))}
          </div>
        ) : (
          <p className="rounded-xl border border-dashed border-neutral-300 bg-neutral-50 px-4 py-8 text-sm text-neutral-600">
            Seller orders will show up here once buyers start purchasing from your shops.
          </p>
        )}
      </SectionCard>
    </DashboardShell>
  );
}
