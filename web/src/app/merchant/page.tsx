import {
  DashboardShell,
  MetricCard,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { getOrderItemsByOrderIds, getSellerDashboardData } from "@/lib/data/marketplace";
import { requireRole } from "@/lib/auth/server";
import { MerchantProductForm } from "@/app/merchant/products/product-form";
import { SellerProductInventory } from "@/app/merchant/seller-product-inventory";
import { SellerOrdersQueue } from "@/app/merchant/seller-orders-queue";
import { Badge } from "@/components/ui/badge";

export default async function MerchantDashboardPage() {
  const user = await requireRole(["seller"]);
  const data = await getSellerDashboardData(user.id);
  const orderItemsByOrderId = await getOrderItemsByOrderIds(
    data.orders.map((order) => order.id),
  );

  return (
    <DashboardShell
      eyebrow="Seller workspace"
      title="Seller dashboard"
      description="Post products, manage your catalog, and fulfill buyer orders from this single hub."
      actions={
        <>
          <LinkButton href="/merchant/orders" variant="outline">
            Orders only
          </LinkButton>
          <LinkButton href="/merchant/products" variant="outline">
            Products only
          </LinkButton>
          <LinkButton href="/account" variant="outline">
            Account
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

      <div id="storefront-setup" className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Your storefronts"
          description="Shops linked to your account in Supabase."
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
              No shop is linked to this seller yet. Add a row in the{" "}
              <code className="rounded bg-neutral-200 px-1">shops</code> table with your user
              ID as <code className="rounded bg-neutral-200 px-1">owner_id</code>, then refresh
              this page to publish products.
            </p>
          )}
        </SectionCard>

        <SectionCard
          title="Low stock"
          description="Products that may need restocking soon."
          action={
            <LinkButton href="/merchant/products" variant="outline" size="sm">
              Full catalog
            </LinkButton>
          }
        >
          {data.lowStockProducts.length ? (
            <div className="space-y-3">
              {data.lowStockProducts.slice(0, 6).map((product) => (
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
              No products are running critically low.
            </p>
          )}
        </SectionCard>
      </div>

      {data.shops.length ? (
        <div id="post-product">
          <SectionCard
            title="Post a new product"
            description="Create a listing and choose whether it goes live immediately."
            action={
              <LinkButton href="/merchant/products/new" variant="outline" size="sm">
                Full-page form
              </LinkButton>
            }
          >
            <MerchantProductForm
              mode="create"
              shops={data.shops}
              redirectAfterSave="/merchant"
              cancelHref="/merchant#catalog"
            />
          </SectionCard>
        </div>
      ) : null}

      <div id="catalog">
        <SectionCard
          title="Your products"
          description="Publish, pause, or edit everything you sell."
          action={
            <div className="flex flex-wrap gap-2">
              {data.shops.map((shop) => (
                <Badge key={shop.id} variant="outline">
                  {shop.name}
                </Badge>
              ))}
              <LinkButton href="/merchant/products/new" size="sm">
                Add product
              </LinkButton>
            </div>
          }
        >
          <SellerProductInventory
            products={data.products}
            emptyTitle={data.shops.length ? "No products yet" : "Set up a shop first"}
            emptyDescription={
              data.shops.length
                ? "Use the form above or add a product to start appearing in the marketplace."
                : "Create a shop record for your seller account before you can list inventory."
            }
            emptyActionHref={
              data.shops.length ? "/merchant#post-product" : "/merchant#storefront-setup"
            }
            emptyActionLabel={data.shops.length ? "Post a product" : "Storefront setup"}
          />
        </SectionCard>
      </div>

      <SectionCard
        title="Orders from buyers"
        description="Review payments, line items, and move orders into dispatch."
        action={
          <LinkButton href="/merchant/orders" variant="outline" size="sm">
            Dedicated orders page
          </LinkButton>
        }
      >
        <SellerOrdersQueue
          orders={data.orders}
          orderItemsByOrderId={orderItemsByOrderId}
          emptyTitle="No orders yet"
          emptyDescription="When buyers pay for your products, every order will show up here with actions to dispatch or flag issues."
          emptyActionHref="/merchant#catalog"
          emptyActionLabel="Manage products"
        />
      </SectionCard>
    </DashboardShell>
  );
}
