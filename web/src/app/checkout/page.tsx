"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { LinkButton } from "@/components/ui/link-button";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/lib/auth/context";
import { useCart } from "@/lib/cart/context";
import { cn } from "@/lib/utils";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import {
  createDemoOrder,
  formatDemoPaymentProvider,
  type DemoPaymentProvider as PaymentProvider,
} from "@/lib/demo-payments";
import { toast } from "sonner";

const ETB_TO_KES = 0.65;

const PAYMENT_OPTIONS: Array<{
  id: PaymentProvider;
  label: string;
  badge: string;
  description: string;
}> = [
  {
    id: "chapa",
    label: "Chapa",
    badge: "ETB sandbox",
    description: "Hosted checkout style sandbox for cards, bank transfer, and wallets.",
  },
  {
    id: "mpesa",
    label: "M-Pesa",
    badge: "STK sandbox",
    description: "Mobile push payment sandbox for Kenyan buyers paying in KES.",
  },
];

export default function CheckoutPage() {
  const router = useRouter();
  const {
    items,
    subtotal,
    clear,
    mode,
    isHydrating,
    isSyncing,
    syncError,
    refresh,
  } = useCart();
  const { user, deliveryZone } = useAuth();
  const [provider, setProvider] = useState<PaymentProvider>("chapa");
  const [customerName, setCustomerName] = useState(user?.full_name ?? "Marketplace Buyer");
  const [phone, setPhone] = useState(user?.phone ?? "+254708374149");
  const [email, setEmail] = useState(user?.email ?? "buyer@misrak.local");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const groups = useMemo(() => {
    const byShop = new Map<string, (typeof items)[0][]>();

    items.forEach((item) => {
      const grouped = byShop.get(item.shop_id) ?? [];
      grouped.push(item);
      byShop.set(item.shop_id, grouped);
    });

    return Array.from(byShop.entries()).map(([shopId, shopItems]) => {
      const shop = shopItems[0]?.product?.shop;
      const delivery =
        shop?.city != null ? calculateDeliveryFee(shop.city, deliveryZone).fee : 0;

      return {
        shopId,
        shopName: shop?.name ?? "Unknown seller",
        delivery,
        items: shopItems,
      };
    });
  }, [deliveryZone, items]);

  const deliveryTotal = groups.reduce((sum, group) => sum + group.delivery, 0);
  const totalEtb = subtotal + deliveryTotal;
  const totalKes = Math.round(totalEtb * ETB_TO_KES);
  const activeProviderLabel = formatDemoPaymentProvider(provider);
  const accountCheckoutReady = Boolean(user) && mode === "account" && !syncError;
  const checkoutModeLabel = accountCheckoutReady ? "Marketplace checkout" : "Sandbox fallback";
  const checkoutModeTone = accountCheckoutReady
    ? "bg-emerald-100 text-emerald-900"
    : "bg-amber-100 text-amber-900";

  async function handlePayment() {
    setSubmitError(null);
    setSubmitMessage(null);

    if (!items.length) {
      toast.error("Add products to your cart before starting checkout.");
      return;
    }

    if (!customerName.trim()) {
      toast.error("Enter the customer name for this checkout.");
      return;
    }

    if (!phone.trim()) {
      toast.error(
        provider === "mpesa"
          ? "Enter an M-Pesa phone number."
          : "Enter a customer phone number.",
      );
      return;
    }

    if (provider === "chapa" && !email.trim()) {
      toast.error("Enter an email to simulate the Chapa sandbox checkout.");
      return;
    }

    setIsSubmitting(true);

    try {
      if (accountCheckoutReady) {
        const response = await fetch("/api/checkout", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            provider,
            customerName,
            customerPhone: phone,
            customerEmail: provider === "chapa" ? email : undefined,
            deliveryZone,
            items,
          }),
        });
        const payload = (await response.json()) as {
          orders?: Array<{ id: string }>;
          error?: string;
        };

        if (!response.ok || !payload.orders?.length) {
          throw new Error(payload.error ?? "Unable to create marketplace order.");
        }

        clear();
        const message =
          payload.orders.length > 1
            ? `Created ${payload.orders.length} marketplace orders. View them in order history.`
            : `${activeProviderLabel} marketplace payment is now in escrow.`;
        setSubmitMessage(message);
        toast.success(message);
        const newParam =
          payload.orders.length > 1
            ? payload.orders.map((o) => o.id).join(",")
            : payload.orders[0]?.id;
        router.push(
          newParam ? `/orders?new=${encodeURIComponent(newParam)}` : "/orders",
        );
        router.refresh();
        return;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 900));

      const order = createDemoOrder({
        provider,
        customerName,
        customerPhone: phone,
        customerEmail: provider === "chapa" ? email : undefined,
        deliveryZone,
        subtotalEtb: subtotal,
        deliveryEtb: deliveryTotal,
        totalEtb,
        totalKes: provider === "mpesa" ? totalKes : null,
        items,
      });

      clear();
      const message = `${activeProviderLabel} sandbox payment approved on this device.`;
      setSubmitMessage(message);
      toast.success(message);
      router.push(`/orders?highlight=${encodeURIComponent(order.id)}`);
      router.refresh();
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Checkout failed. Please try again.";
      setSubmitError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isHydrating && !items.length) {
    return (
      <main className="mx-auto max-w-5xl px-4 py-12">
        <Card>
          <CardContent className="py-12 text-center text-sm text-neutral-500">
            Loading your saved cart before checkout...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <Badge className={checkoutModeTone} variant="outline">
              {checkoutModeLabel}
            </Badge>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">Your cart is empty</h1>
              <p className="mt-2 text-sm text-neutral-600">
                Add items first, then return here to complete checkout.
              </p>
            </div>
            <LinkButton href="/products" className="w-full bg-[#4F46E5]">
              Continue shopping
            </LinkButton>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <div className="rounded-lg border border-neutral-200 bg-white px-4 py-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <Badge className={checkoutModeTone} variant="outline">
            {checkoutModeLabel}
          </Badge>
          {isSyncing ? <Badge variant="outline">Saving cart changes...</Badge> : null}
        </div>
        <p className="mt-3 text-sm text-neutral-700">
          {accountCheckoutReady
            ? "Your buyer account cart is ready. Completing payment here will create live marketplace orders."
            : "This checkout page is ready, but without an account-synced cart it will fall back to a browser-saved sandbox order."}
        </p>
        {syncError ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-amber-800">{syncError}</p>
            {user ? (
              <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
                Retry account sync
              </Button>
            ) : null}
            {!user ? (
              <LinkButton href="/auth" variant="outline" size="sm">
                Sign in for live checkout
              </LinkButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <section className="min-w-0 flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1B4B]">Checkout</h1>
            <p className="mt-2 text-sm text-neutral-600">
              Review the buyer details, confirm delivery coverage, choose a payment
              method, and send the order into escrow.
            </p>
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">Buyer details</p>
                <p className="mt-1 text-sm text-neutral-600">
                  These details will be attached to the checkout and delivery handoff.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">Customer name</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Abebe Demo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {provider === "mpesa" ? "Phone (M-Pesa)" : "Phone"}
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={provider === "mpesa" ? "2547XXXXXXXX" : "+2519XXXXXXXX"}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    placeholder="buyer@example.com"
                  />
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">Delivery summary</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Current delivery zone and multi-shop handoff estimate for this cart.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Delivery zone
                  </p>
                  <p className="mt-2 font-semibold text-[#1E1B4B]">
                    {deliveryZone.replace(/_/g, " ")}
                  </p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    Delivery groups
                  </p>
                  <p className="mt-2 font-semibold text-[#1E1B4B]">{groups.length}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">Payment method</p>
                <p className="mt-1 text-sm text-neutral-600">
                  Pick the payment rail you want to use for this checkout.
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {PAYMENT_OPTIONS.map((option) => {
                  const selected = option.id === provider;

                  return (
                    <button
                      key={option.id}
                      type="button"
                      className={cn(
                        "rounded-xl border p-4 text-left transition-colors",
                        selected
                          ? "border-[#4F46E5] bg-indigo-50 shadow-sm"
                          : "border-neutral-200 bg-white hover:border-indigo-200",
                      )}
                      onClick={() => setProvider(option.id)}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-semibold text-[#1E1B4B]">{option.label}</p>
                        <Badge variant="outline">{option.badge}</Badge>
                      </div>
                      <p className="mt-2 text-sm text-neutral-600">
                        {option.description}
                      </p>
                    </button>
                  );
                })}
              </div>

              <Separator />

              <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4 text-sm text-neutral-700">
                <p className="font-semibold text-[#1E1B4B]">
                  {provider === "chapa" ? "Chapa checkout notes" : "M-Pesa checkout notes"}
                </p>
                <p className="mt-2">
                  {accountCheckoutReady
                    ? provider === "chapa"
                      ? "Submitting now will create live marketplace orders and record Chapa as the selected payment provider."
                      : `Submitting now will create live marketplace orders and record an M-Pesa payment using ${totalKes.toLocaleString()} KES as the demo conversion reference.`
                    : provider === "chapa"
                      ? "A successful hosted checkout will be simulated immediately after you confirm the buyer details."
                      : `A successful STK push will be simulated using ${totalKes.toLocaleString()} KES.`}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  Delivery zone: {deliveryZone.replace(/_/g, " ")}
                </p>
              </div>

              {submitMessage ? (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-800">
                  {submitMessage}
                </div>
              ) : null}

              {submitError ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
                  {submitError}
                </div>
              ) : null}
            </CardContent>
          </Card>
        </section>

        <aside className="lg:w-96">
          <Card className="lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">Order summary</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {items.length} cart lines using {activeProviderLabel} on the{" "}
                  {accountCheckoutReady ? "buyer account checkout" : "sandbox fallback"}.
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Subtotal</span>
                  <span className="font-medium">{subtotal.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Delivery</span>
                  <span className="font-medium">{deliveryTotal.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Escrow total</span>
                  <span className="font-semibold text-[#1E1B4B]">
                    {totalEtb.toLocaleString()} ETB
                  </span>
                </div>
                {provider === "mpesa" ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-600">Sandbox conversion</span>
                    <span className="font-medium">
                      {totalKes.toLocaleString()} KES
                    </span>
                  </div>
                ) : null}
              </div>

              <Separator />

              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.shopId} className="rounded-xl border border-neutral-200 p-3">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium text-neutral-900">{group.shopName}</p>
                      <span className="text-xs text-neutral-500">
                        Delivery {group.delivery.toLocaleString()} ETB
                      </span>
                    </div>
                    <div className="mt-3 space-y-2 text-sm">
                      {group.items.map((item) => (
                        <div
                          key={item.product_id}
                          className="flex items-start justify-between gap-3"
                        >
                          <div>
                            <p className="font-medium text-neutral-900">
                              {item.product?.name ?? "Marketplace item"}
                            </p>
                            <p className="text-xs text-neutral-500">Qty {item.quantity}</p>
                          </div>
                          <span className="text-sm font-medium text-neutral-700">
                            {(item.price_at_add * item.quantity).toLocaleString()} ETB
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              <Button
                className="w-full bg-[#4F46E5]"
                disabled={isSubmitting || isHydrating}
                onClick={() => void handlePayment()}
              >
                {isSubmitting
                  ? `Processing ${activeProviderLabel}...`
                  : accountCheckoutReady
                    ? `Pay with ${activeProviderLabel}`
                    : `Pay with ${activeProviderLabel} sandbox`}
              </Button>

              <LinkButton href="/cart" variant="outline" className="w-full">
                Back to cart
              </LinkButton>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
