import { Badge } from "@/components/ui/badge";
import {
  DashboardShell,
  EmptyStateCard,
  MetricCard,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { requireRole } from "@/lib/auth/server";
import { getSellerDashboardData } from "@/lib/data/marketplace";
import { LinkButton } from "@/components/ui/link-button";
import { EntityToggleButton } from "@/components/dashboard/entity-toggle-button";

export default async function MerchantProductsPage() {
  const user = await requireRole(["seller"]);
  const data = await getSellerDashboardData(user.id);

  return (
    <DashboardShell
      eyebrow="Seller catalog"
      title="Products"
      description="Manage storefront inventory, jump into edits, and publish or hide products without leaving the seller workspace."
      actions={
        <>
          <LinkButton href="/merchant/products/new" className="bg-[#4F46E5] hover:bg-[#4338CA]">
            Add product
          </LinkButton>
          <LinkButton href="/merchant/orders" variant="outline">
            Review orders
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Catalog products"
          value={String(data.products.length)}
          hint="All products linked to the current seller account."
        />
        <MetricCard
          label="Live products"
          value={String(data.products.filter((product) => product.is_active).length)}
          hint="Inventory currently visible to buyers."
        />
        <MetricCard
          label="Low stock"
          value={String(data.lowStockProducts.length)}
          hint="Items that need inventory attention soon."
        />
        <MetricCard
          label="Draft or paused"
          value={String(data.products.filter((product) => !product.is_active).length)}
          hint="Products hidden from the live marketplace."
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {data.shops.map((shop) => (
          <Badge key={shop.id} variant="outline">
            {shop.name}
          </Badge>
        ))}
      </div>

      <SectionCard
        title="Catalog inventory"
        description="Review pricing, stock, publication status, and jump directly into edits."
      >
        {data.products.length ? (
          <div className="space-y-3">
            {data.products.map((product) => (
              <div
                key={product.id}
                className="flex flex-col gap-4 rounded-xl border border-neutral-200 p-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="font-medium text-[#1E1B4B]">{product.name}</p>
                    <p className="mt-1 text-sm text-neutral-600">
                      {product.shop?.name ?? "Unassigned shop"} ·{" "}
                      {product.price.toLocaleString()} ETB
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {product.category} · Stock {product.stock}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant={product.is_active ? "secondary" : "outline"}>
                      {product.is_active ? "Live" : "Paused"}
                    </Badge>
                    <Badge variant={product.stock > 5 ? "outline" : "destructive"}>
                      Stock: {product.stock}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <LinkButton href={`/merchant/products/${product.id}`} variant="outline" size="sm">
                    Edit details
                  </LinkButton>
                  <EntityToggleButton
                    endpoint={`/api/dashboard/products/${product.id}`}
                    isActive={product.is_active}
                    activeLabel="Pause listing"
                    inactiveLabel="Publish listing"
                  />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <EmptyStateCard
            title="No products yet"
            description="This seller account does not have any catalog items yet. Add your first product to start selling."
            actionHref="/merchant/products/new"
            actionLabel="Create product"
          />
        )}
      </SectionCard>
    </DashboardShell>
  );
}
