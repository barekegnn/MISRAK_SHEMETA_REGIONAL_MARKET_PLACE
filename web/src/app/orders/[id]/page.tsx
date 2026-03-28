import Link from "next/link";
import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { LinkButton } from "@/components/ui/link-button";
import {
  OrderStatusBadge,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { getBuyerOrderById, getBuyerOrderItems } from "@/lib/data/marketplace";
import { getCurrentUser } from "@/lib/auth/server";
import { getDashboardRoute } from "@/lib/auth/shared";
import { DemoOrderDetail } from "./demo-order-detail";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();

  if (user && user.role !== "buyer") {
    redirect(getDashboardRoute(user.role));
  }

  const order =
    user?.role === "buyer" ? await getBuyerOrderById(id, user.id) : null;
  const orderItems =
    order && user?.role === "buyer" ? await getBuyerOrderItems(order.id, user.id) : [];

  if (!order) {
    return <DemoOrderDetail orderId={id} />;
  }

  const canTrackShipment =
    order.status === "DISPATCHED" || order.status === "COMPLETED";

  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <p className="text-sm text-neutral-500">
        <Link href="/orders" className="hover:underline">
          ← Orders
        </Link>
      </p>
      <h1 className="mt-2 text-2xl font-bold text-[#1E1B4B]">Order {order.id}</h1>
      <p className="mt-2 text-sm text-neutral-600">
        Live marketplace order detail for payment status, delivery handoff, and
        customer confirmation.
      </p>
      <div className="mt-6 rounded-lg border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <OrderStatusBadge status={order.status} />
          {order.payment_provider ? (
            <Badge variant="outline">
              {order.payment_provider === "chapa" ? "Chapa" : "M-Pesa"}
            </Badge>
          ) : null}
          <p className="text-sm text-neutral-600">
            Delivering to {formatLabel(order.delivery_zone)}
          </p>
        </div>
        <Separator className="my-6" />
        <div className="grid gap-3 md:grid-cols-2">
          <p className="text-sm text-neutral-600">
            Customer: {order.customer_name ?? "Pending"}
          </p>
          <p className="text-sm text-neutral-600">
            Total: {order.total_amount.toLocaleString()} ETB
          </p>
          <p className="text-sm text-neutral-600">
            Delivery fee: {order.delivery_fee.toLocaleString()} ETB
          </p>
          <p className="text-sm text-neutral-600">
            Payment provider:{" "}
            {order.payment_provider === "chapa"
              ? "Chapa"
              : order.payment_provider === "mpesa"
                ? "M-Pesa"
                : "Not recorded"}
          </p>
          <p className="text-sm text-neutral-600">
            Payment reference: {order.payment_reference ?? "Not recorded"}
          </p>
          <p className="text-sm text-neutral-600">
            Email: {order.customer_email ?? "Not recorded"}
          </p>
        </div>
        {orderItems.length ? (
          <>
            <Separator className="my-6" />
            <div>
              <p className="text-sm font-semibold text-[#1E1B4B]">Order items</p>
              <div className="mt-3 space-y-3">
                {orderItems.map((item) => (
                  <div
                    key={`${order.id}-${item.product_id}`}
                    className="flex items-start justify-between gap-4 rounded-lg border border-neutral-200 p-3"
                  >
                    <div>
                      <p className="font-medium text-neutral-900">
                        {item.product_name ?? "Marketplace item"}
                      </p>
                      <p className="mt-1 text-sm text-neutral-500">
                        {item.shop_name ?? formatLabel(item.shop_id)} · Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-sm font-medium text-[#1E1B4B]">
                      {(item.price_at_purchase * item.quantity).toLocaleString()} ETB
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        ) : null}
        <p className="mt-6 text-sm text-neutral-600">Delivery OTP</p>
        <p className="mt-2 text-4xl font-mono font-bold tracking-widest text-[#4F46E5]">
          {order.delivery_otp ?? "------"}
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          {canTrackShipment ? (
            <LinkButton
              href={`/orders/${order.id}/tracking`}
              className="bg-[#4F46E5] hover:bg-[#4338CA]"
            >
              Track shipment
            </LinkButton>
          ) : null}
          <LinkButton href="/products" variant="outline">
            Continue shopping
          </LinkButton>
        </div>
      </div>
    </main>
  );
}
