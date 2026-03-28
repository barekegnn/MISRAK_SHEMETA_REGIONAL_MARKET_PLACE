import {
  DashboardShell,
  MetricCard,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { requireRole } from "@/lib/auth/server";
import { getSellerDashboardData } from "@/lib/data/marketplace";
import { LinkButton } from "@/components/ui/link-button";
import { Badge } from "@/components/ui/badge";
import { SellerProductInventory } from "@/app/merchant/seller-product-inventory";

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
        <SellerProductInventory
          products={data.products}
          emptyTitle="No products yet"
          emptyDescription="This seller account does not have any catalog items yet. Add your first product to start selling."
          emptyActionHref="/merchant/products/new"
          emptyActionLabel="Create product"
        />
      </SectionCard>
    </DashboardShell>
  );
}
