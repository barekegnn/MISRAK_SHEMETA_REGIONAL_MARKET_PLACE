import { redirect } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  DashboardShell,
  EmptyStateCard,
  OrderStatusBadge,
  SectionCard,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { LinkButton } from "@/components/ui/link-button";
import { BrowserOrdersSection } from "./browser-orders-section";
import { PaymentProviderLogo } from "@/components/payments/payment-provider-logo";
import { getBuyerOrders } from "@/lib/data/marketplace";
import { getCurrentUser } from "@/lib/auth/server";
import { getDashboardRoute } from "@/lib/auth/shared";

type SearchParams = Promise<{ new?: string; highlight?: string }>;

export default async function OrdersPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const checkoutOrderIds = Array.from(
    new Set([
      ...(sp.new?.split(",").map((id) => id.trim()).filter(Boolean) ?? []),
      ...(sp.highlight?.trim() ? [sp.highlight.trim()] : []),
    ]),
  );

  const user = await getCurrentUser();

  if (user && user.role !== "buyer") {
    redirect(getDashboardRoute(user.role));
  }

  const liveOrders = user ? await getBuyerOrders(user.id) : [];

  return (
    <DashboardShell
      eyebrow="Buyer orders"
      title="Orders"
      description="Follow your live marketplace purchases first, while still keeping browser-saved sandbox checkouts available in their own section."
      actions={
        <>
          <LinkButton href="/products" className="bg-[#4F46E5] hover:bg-[#4338CA]">
            Browse catalog
          </LinkButton>
          {user ? (
            <LinkButton href="/account" variant="outline">
              Account
            </LinkButton>
          ) : (
            <LinkButton href="/auth" variant="outline">
              Sign in
            </LinkButton>
          )}
        </>
      }
    >
      {checkoutOrderIds.length ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
          <p className="font-medium">Checkout complete</p>
          <p className="mt-1 text-emerald-800">
            Your new order{checkoutOrderIds.length > 1 ? "s are" : " is"} highlighted
            below. Browser-saved sandbox checkouts remain available in their own history
            section.
          </p>
        </div>
      ) : null}

      <SectionCard
        title="Marketplace orders"
        description="Orders synced from Supabase for the signed-in buyer account."
        action={
          !user ? (
            <LinkButton href="/auth" variant="outline" size="sm">
              Sign in
            </LinkButton>
          ) : null
        }
      >
        {user ? (
          liveOrders.length ? (
            <div className="space-y-3">
              {liveOrders.map((order) => (
                <div
                  key={order.id}
                  className={`flex flex-col gap-3 rounded-xl border border-neutral-200 bg-white p-4 md:flex-row md:items-center md:justify-between ${
                    checkoutOrderIds.includes(order.id)
                      ? "ring-2 ring-emerald-500 ring-offset-2"
                      : ""
                  }`}
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-medium text-[#1E1B4B]">{order.id}</p>
                      {order.payment_provider ? (
                        <Badge
                          variant="outline"
                          className="inline-flex items-center gap-1.5 border-neutral-200 py-1 pl-1.5 pr-2"
                        >
                          <PaymentProviderLogo
                            provider={order.payment_provider}
                            height={18}
                            className="max-h-[18px]"
                          />
                        </Badge>
                      ) : null}
                    </div>
                    <p className="mt-1 text-sm text-neutral-600">
                      {order.total_amount.toLocaleString()} ETB ·{" "}
                      {formatLabel(order.delivery_zone)}
                    </p>
                    <p className="mt-1 text-xs text-neutral-500">
                      {order.customer_name ?? "Buyer account order"} ·{" "}
                      {new Date(order.created_at).toLocaleDateString(undefined, {
                        dateStyle: "medium",
                      })}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <OrderStatusBadge status={order.status} />
                    <LinkButton href={`/orders/${order.id}`} variant="outline" size="sm">
                      View details
                    </LinkButton>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyStateCard
              title="No live orders yet"
              description="Your signed-in buyer account has not created any Supabase-backed orders yet."
              actionHref="/products"
              actionLabel="Browse products"
            />
          )
        ) : (
          <EmptyStateCard
            title="Sign in to view live marketplace orders"
            description="Live order history is attached to your buyer account. You can still view browser-saved sandbox checkouts below."
            actionHref="/auth"
            actionLabel="Sign in"
          />
        )}
      </SectionCard>

      <BrowserOrdersSection />
    </DashboardShell>
  );
}
