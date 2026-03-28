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
import { isMarketplaceBuyer } from "@/lib/auth/shared";
import { useCart } from "@/lib/cart/context";
import { cn } from "@/lib/utils";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import {
  formatDemoPaymentProvider,
  type DemoPaymentProvider as PaymentProvider,
} from "@/lib/demo-payments";
import { PaymentProviderLogo } from "@/components/payments/payment-provider-logo";
import { toast } from "sonner";
import { useI18n } from "@/lib/i18n/context";
import { translateDeliveryZone } from "@/lib/i18n/labels";

const ETB_TO_KES = 0.65;

export default function CheckoutPage() {
  const router = useRouter();
  const { t } = useI18n();
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
  const { user, deliveryZone, supabaseUser } = useAuth();
  const [provider, setProvider] = useState<PaymentProvider>("chapa");
  const [customerName, setCustomerName] = useState(user?.full_name ?? "Marketplace Buyer");
  const [phone, setPhone] = useState(user?.phone ?? "+254708374149");
  const [email, setEmail] = useState(user?.email ?? "buyer@misrak.local");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const paymentOptions = useMemo(
    () =>
      [
        {
          id: "chapa" as const,
          badge: t("checkout_pay_chapa_badge"),
          description: t("checkout_pay_chapa_desc"),
        },
        {
          id: "mpesa" as const,
          badge: t("checkout_pay_mpesa_badge"),
          description: t("checkout_pay_mpesa_desc"),
        },
      ] as const,
    [t],
  );

  const zoneLabel = translateDeliveryZone(deliveryZone, t);

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
        shopName: shop?.name ?? t("checkout_unknownSeller"),
        delivery,
        items: shopItems,
      };
    });
  }, [deliveryZone, items, t]);

  const deliveryTotal = groups.reduce((sum, group) => sum + group.delivery, 0);
  const totalEtb = subtotal + deliveryTotal;
  const totalKes = Math.round(totalEtb * ETB_TO_KES);
  const activeProviderLabel = formatDemoPaymentProvider(provider);
  const buyerSession = isMarketplaceBuyer(user);
  const accountCheckoutReady =
    buyerSession && Boolean(supabaseUser) && mode === "account" && !syncError;
  const checkoutModeLabel = accountCheckoutReady
    ? t("checkout_mode_buyerReady")
    : buyerSession
      ? t("checkout_mode_sync")
      : t("checkout_mode_signin");
  const checkoutModeTone = accountCheckoutReady
    ? "bg-emerald-100 text-emerald-900"
    : "bg-amber-100 text-amber-900";

  async function handlePayment() {
    setSubmitError(null);
    setSubmitMessage(null);

    if (!items.length) {
      toast.error(t("checkout_toast_empty"));
      return;
    }

    if (!isMarketplaceBuyer(user)) {
      toast.error(t("checkout_toast_buyer"));
      return;
    }

    if (!accountCheckoutReady) {
      toast.error(syncError ?? t("checkout_toast_sync"));
      return;
    }

    if (!customerName.trim()) {
      toast.error(t("checkout_toast_name"));
      return;
    }

    if (!phone.trim()) {
      toast.error(
        provider === "mpesa"
          ? t("checkout_toast_phoneMpesa")
          : t("checkout_toast_phone"),
      );
      return;
    }

    if (provider === "chapa" && !email.trim()) {
      toast.error(t("checkout_toast_chapaEmail"));
      return;
    }

    setIsSubmitting(true);

    try {
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
        throw new Error(payload.error ?? t("checkout_toast_orderFail"));
      }

      clear();
      const message =
        payload.orders.length > 1
          ? t("checkout_success_multi", {
              count: payload.orders.length,
            })
          : t("checkout_success_single", { provider: activeProviderLabel });
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
    } catch (error) {
      const message =
        error instanceof Error ? error.message : t("checkout_error_generic");
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
            {t("checkout_loadingCart")}
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
              <h1 className="text-2xl font-bold text-[#1E1B4B]">
                {t("checkout_emptyTitle")}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {t("checkout_emptyBody")}
              </p>
            </div>
            <LinkButton href="/products" className="w-full bg-[#4F46E5]">
              {t("checkout_continueShopping")}
            </LinkButton>
            {!user ? (
              <LinkButton href="/auth" variant="outline" className="w-full">
                {t("signIn")}
              </LinkButton>
            ) : null}
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!buyerSession) {
    return (
      <main className="mx-auto max-w-lg px-4 py-12">
        <Card>
          <CardContent className="space-y-4 p-6 text-center">
            <Badge className="bg-amber-100 text-amber-900" variant="outline">
              {t("checkout_badge_buyer")}
            </Badge>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">
                {t("checkout_buyerOnlyTitle")}
              </h1>
              <p className="mt-2 text-sm text-neutral-600">
                {user
                  ? t("checkout_buyerOnlyBodyAuthed")
                  : t("checkout_buyerOnlyBodyGuest")}
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <LinkButton href="/auth" className="w-full bg-[#4F46E5]">
                {user ? t("checkout_switchBuyer") : t("signIn")}
              </LinkButton>
              {user && user.role === "seller" ? (
                <LinkButton href="/merchant" variant="outline" className="w-full">
                  {t("checkout_openMerchant")}
                </LinkButton>
              ) : null}
              <LinkButton href="/cart" variant="outline" className="w-full">
                {t("checkout_backCart")}
              </LinkButton>
            </div>
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
          {isSyncing ? (
            <Badge variant="outline">{t("checkout_savingCart")}</Badge>
          ) : null}
        </div>
        <p className="mt-3 text-sm text-neutral-700">
          {accountCheckoutReady
            ? t("checkout_sync_ok")
            : t("checkout_sync_wait")}
        </p>
        {syncError ? (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <p className="text-sm text-amber-800">{syncError}</p>
            {user ? (
              <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
                {t("checkout_retrySync")}
              </Button>
            ) : null}
            {!user ? (
              <LinkButton href="/auth" variant="outline" size="sm">
                {t("checkout_signinLive")}
              </LinkButton>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="mt-6 flex flex-col gap-8 lg:flex-row">
        <section className="min-w-0 flex-1 space-y-4">
          <div>
            <h1 className="text-3xl font-bold text-[#1E1B4B]">{t("checkout_title")}</h1>
            <p className="mt-2 text-sm text-neutral-600">{t("checkout_subtitle")}</p>
          </div>

          <Card>
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {t("checkout_buyerDetails")}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("checkout_buyerDetailsHint")}
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="customerName">{t("checkout_customerName")}</Label>
                  <Input
                    id="customerName"
                    value={customerName}
                    onChange={(event) => setCustomerName(event.target.value)}
                    placeholder="Abebe Demo"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    {provider === "mpesa"
                      ? t("checkout_phoneMpesa")
                      : t("checkout_phone")}
                  </Label>
                  <Input
                    id="phone"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value)}
                    placeholder={provider === "mpesa" ? "2547XXXXXXXX" : "+2519XXXXXXXX"}
                  />
                </div>

                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="email">{t("checkout_email")}</Label>
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
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {t("checkout_deliverySummary")}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("checkout_deliverySummaryHint")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {t("checkout_deliveryZone")}
                  </p>
                  <p className="mt-2 font-semibold text-[#1E1B4B]">{zoneLabel}</p>
                </div>
                <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">
                    {t("checkout_deliveryGroups")}
                  </p>
                  <p className="mt-2 font-semibold text-[#1E1B4B]">{groups.length}</p>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {t("checkout_paymentMethod")}
                </p>
                <p className="mt-1 text-sm text-neutral-600">
                  {t("checkout_paymentHint")}
                </p>
              </div>

              <div className="grid gap-3 md:grid-cols-2">
                {paymentOptions.map((option) => {
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
                      <span className="sr-only">
                        {option.id === "chapa" ? "Chapa" : "M-Pesa"}
                      </span>
                      <div className="flex items-center justify-between gap-3">
                        <PaymentProviderLogo
                          provider={option.id}
                          height={28}
                          className="max-h-7"
                        />
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
                <p className="flex flex-wrap items-center gap-2 font-semibold text-[#1E1B4B]">
                  <PaymentProviderLogo provider={provider} height={22} className="max-h-5" />
                  <span>{t("checkout_notesTitle")}</span>
                </p>
                <p className="mt-2">
                  {accountCheckoutReady
                    ? provider === "chapa"
                      ? t("checkout_note_chapa")
                      : t("checkout_note_mpesa", { kes: totalKes.toLocaleString() })
                    : t("checkout_note_sync")}
                </p>
                <p className="mt-2 text-xs text-neutral-500">
                  {t("checkout_zoneLine", { zone: zoneLabel })}
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
                <p className="text-sm font-semibold text-[#1E1B4B]">
                  {t("checkout_orderSummary")}
                </p>
                <p className="mt-1 flex flex-wrap items-center gap-2 text-sm text-neutral-600">
                  <span>{t("checkout_summaryLines", { count: items.length })}</span>
                  <PaymentProviderLogo provider={provider} height={22} className="inline-block max-h-5" />
                  <span>
                    {accountCheckoutReady
                      ? t("checkout_summarySynced")
                      : t("checkout_summaryPending")}
                  </span>
                </p>
              </div>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">{t("subtotal")}</span>
                  <span className="font-medium">{subtotal.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">{t("delivery")}</span>
                  <span className="font-medium">{deliveryTotal.toLocaleString()} ETB</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">{t("checkout_escrowTotal")}</span>
                  <span className="font-semibold text-[#1E1B4B]">
                    {totalEtb.toLocaleString()} ETB
                  </span>
                </div>
                {provider === "mpesa" ? (
                  <div className="flex justify-between gap-4">
                    <span className="text-neutral-600">{t("checkout_sandboxConversion")}</span>
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
                        {t("checkout_deliveryFee", {
                          amount: group.delivery.toLocaleString(),
                        })}
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
                              {item.product?.name ?? t("checkout_marketplaceItem")}
                            </p>
                            <p className="text-xs text-neutral-500">
                              {t("checkout_qty", { n: item.quantity })}
                            </p>
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
                disabled={isSubmitting || isHydrating || !accountCheckoutReady}
                onClick={() => void handlePayment()}
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span>{t("checkout_processing")}</span>
                    <span className="rounded-md bg-white/20 px-1.5 py-0.5">
                      <PaymentProviderLogo provider={provider} height={22} className="max-h-5" />
                    </span>
                  </span>
                ) : (
                  <span className="inline-flex items-center justify-center gap-2">
                    <span>{t("checkout_payWith")}</span>
                    <span className="rounded-md bg-white/20 px-1.5 py-0.5">
                      <PaymentProviderLogo provider={provider} height={22} className="max-h-5" />
                    </span>
                  </span>
                )}
              </Button>

              <LinkButton href="/cart" variant="outline" className="w-full">
                {t("checkout_backCart")}
              </LinkButton>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
