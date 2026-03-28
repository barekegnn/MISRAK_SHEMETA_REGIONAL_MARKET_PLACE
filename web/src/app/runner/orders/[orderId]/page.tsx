import Link from "next/link";
import {
  DashboardShell,
  OrderStatusBadge,
  SectionCard,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { requireRole } from "@/lib/auth/server";
import { getRunnerOrderDetail } from "@/lib/data/marketplace";
import { notFound } from "next/navigation";
import { RunnerDeliverySummary } from "../../runner-delivery-summary";
import { RunnerOrderActions } from "../../runner-order-actions";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function RunnerOrderPage({ params }: Props) {
  const { orderId } = await params;
  const user = await requireRole(["runner"]);
  const detail = await getRunnerOrderDetail(orderId, user.id, user.delivery_zone);

  if (!detail) {
    notFound();
  }

  const { order, items, shop, routeEta } = detail;
  const isOpenInZone =
    order.runner_id == null && order.status === "DISPATCHED" && order.delivery_zone === user.delivery_zone;
  const canClaim = Boolean(isOpenInZone);
  const isAssigned = order.runner_id === user.id;

  return (
    <DashboardShell
      eyebrow="Shipping order"
      title={`Order ${order.id}`}
      description="Pickup details, delivery location, and actions for this job."
      actions={
        <>
          <LinkButton href="/runner" variant="outline">
            Back to dashboard
          </LinkButton>
          <LinkButton href="/" variant="outline">
            Storefront
          </LinkButton>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-2">
        <OrderStatusBadge status={order.status} />
        <span className="text-sm text-neutral-600">
          {order.total_amount.toLocaleString()} ETB · fee {order.delivery_fee.toLocaleString()} ETB
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard
          title="Seller pickup"
          description="Collect the package from this shop before heading to the buyer."
        >
          {shop ? (
            <div className="space-y-2 text-sm">
              <p className="font-medium text-neutral-900">{shop.name}</p>
              <p className="text-neutral-600">
                {formatLabel(shop.city)} · {shop.phone}
              </p>
              {routeEta ? (
                <p className="text-neutral-500">
                  Route context: {routeEta.estimatedTime} (fee tier {routeEta.fee} ETB)
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-neutral-600">Shop details unavailable for this order.</p>
          )}
        </SectionCard>

        <SectionCard title="Buyer drop-off" description="Where and who receives the shipment.">
          <RunnerDeliverySummary order={order} />
        </SectionCard>
      </div>

      <SectionCard title="Order actions" description="Claim, pickup, complete, or flag an issue.">
        <RunnerOrderActions
          orderId={order.id}
          status={order.status}
          canClaim={canClaim}
          isAssigned={isAssigned}
        />
      </SectionCard>

      <SectionCard title="Items in this shipment" description="What you are carrying for this order.">
        {items.length ? (
          <div className="grid gap-3 sm:grid-cols-2">
            {items.map((item) => (
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
        ) : (
          <p className="text-sm text-neutral-600">No line items were found for this order.</p>
        )}
      </SectionCard>

      {isAssigned && order.status === "DISPATCHED" ? (
        <p className="text-center text-sm text-neutral-500">
          Need the full dashboard?{" "}
          <Link href="/runner" className="font-medium text-[#4F46E5] hover:underline">
            Return to runner orders
          </Link>
        </p>
      ) : null}
    </DashboardShell>
  );
}
