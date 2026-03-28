import Link from "next/link";
import { redirect } from "next/navigation";
import { TrackingItemsList } from "@/components/orders/TrackingItemsList";
import { TrackingSummaryCard } from "@/components/orders/TrackingSummaryCard";
import { TrackingTimeline } from "@/components/orders/TrackingTimeline";
import { Card, CardContent } from "@/components/ui/card";
import { LinkButton } from "@/components/ui/link-button";
import { getCurrentUser } from "@/lib/auth/server";
import { getDashboardRoute } from "@/lib/auth/shared";
import { getBuyerTrackingOrderById } from "@/lib/data/marketplace";
import { DemoTrackingPage } from "./demo-tracking-page";
import { TrackingClient } from "./tracking-client";

export default async function OrderTrackingPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user && user.role !== "buyer") {
    redirect(getDashboardRoute(user.role));
  }

  const tracking =
    user?.role === "buyer" ? await getBuyerTrackingOrderById(id, user.id) : null;

  if (!tracking) {
    return <DemoTrackingPage orderId={id} />;
  }

  const waitingForDispatch = !tracking.trackingAvailable;

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <p className="text-sm text-neutral-500">
        <Link href={`/orders/${tracking.order.id}`} className="hover:underline">
          ← Order details
        </Link>
      </p>

      <div className="mt-2 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-[#1E1B4B]">
            Shipment tracking
          </h1>
          <p className="mt-2 max-w-2xl text-sm text-neutral-600">
            Follow your order from payment confirmation to final doorstep delivery.
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <LinkButton href={`/orders/${tracking.order.id}`} variant="outline">
            View order details
          </LinkButton>
          <LinkButton href="/products" className="bg-[#4F46E5] hover:bg-[#4338CA]">
            Continue shopping
          </LinkButton>
        </div>
      </div>

      <TrackingClient status={tracking.order.status} refreshedAt={new Date().toISOString()}>
        {waitingForDispatch ? (
          <Card className="border-dashed border-neutral-300 bg-neutral-50/70">
            <CardContent className="py-6">
              <p className="font-semibold text-[#1E1B4B]">
                Tracking becomes available after dispatch
              </p>
              <p className="mt-2 max-w-2xl text-sm text-neutral-600">
                Your order is still being prepared. This page will start auto-refreshing once
                the shop hands the package off for delivery.
              </p>
            </CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <TrackingSummaryCard tracking={tracking} />
          <TrackingTimeline tracking={tracking} />
        </div>

        <TrackingItemsList items={tracking.items} />
      </TrackingClient>
    </main>
  );
}
