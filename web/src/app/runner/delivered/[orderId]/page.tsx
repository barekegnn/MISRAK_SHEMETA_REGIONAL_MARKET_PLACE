import {
  DashboardShell,
  OrderStatusBadge,
  SectionCard,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { requireRole } from "@/lib/auth/server";
import { getRunnerOrderDetail } from "@/lib/data/marketplace";
import { notFound } from "next/navigation";
import { RunnerDeliverySummary } from "../../runner-delivery-summary";

type Props = {
  params: Promise<{ orderId: string }>;
};

export default async function RunnerDeliveredPage({ params }: Props) {
  const { orderId } = await params;
  const user = await requireRole(["runner"]);
  const detail = await getRunnerOrderDetail(orderId, user.id, user.delivery_zone);

  if (!detail || detail.order.status !== "COMPLETED") {
    notFound();
  }

  const { order, items } = detail;

  return (
    <DashboardShell
      eyebrow="Delivery confirmed"
      title="Handoff completed"
      description="This order was marked delivered after the buyer OTP was verified. Thank you for the run."
      actions={
        <>
          <LinkButton href="/runner">Back to orders</LinkButton>
          <LinkButton href="/" variant="outline">
            Storefront
          </LinkButton>
        </>
      }
    >
      <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-6 text-center shadow-sm">
        <p className="text-sm font-semibold uppercase tracking-wide text-emerald-800">Success</p>
        <p className="mt-2 text-2xl font-bold text-[#1E1B4B]">Delivered</p>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600">
          Order <span className="font-mono text-neutral-800">{order.id}</span> is complete. The payout
          flow for sellers and platform fees will continue on the backend.
        </p>
        <div className="mt-4 flex justify-center">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <SectionCard title="Delivery summary" description="Where this package was completed.">
          <RunnerDeliverySummary order={order} />
        </SectionCard>

        <SectionCard title="Shipment contents" description="Items confirmed for this delivery.">
          {items.length ? (
            <ul className="space-y-2 text-sm text-neutral-700">
              {items.map((item) => (
                <li key={`${order.id}-${item.product_id}`} className="flex justify-between gap-4">
                  <span className="font-medium text-neutral-900">
                    {item.product_name ?? "Item"}
                  </span>
                  <span className="text-neutral-500">×{item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-neutral-600">No line items listed.</p>
          )}
        </SectionCard>
      </div>
    </DashboardShell>
  );
}
