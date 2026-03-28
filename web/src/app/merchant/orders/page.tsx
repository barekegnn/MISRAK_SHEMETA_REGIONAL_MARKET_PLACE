import {
  DashboardShell,
  MetricCard,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { requireRole } from "@/lib/auth/server";
import { getOrderItemsByOrderIds, getSellerDashboardData } from "@/lib/data/marketplace";
import { SellerOrdersQueue } from "@/app/merchant/seller-orders-queue";

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
        <SellerOrdersQueue
          orders={data.orders}
          orderItemsByOrderId={orderItemsByOrderId}
          emptyTitle="No seller orders yet"
          emptyDescription="Seller-side order history will appear here once buyers start purchasing your products."
          emptyActionHref="/merchant/products"
          emptyActionLabel="Manage products"
        />
      </SectionCard>
    </DashboardShell>
  );
}
