"use client";

import { useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { useAuth } from "@/lib/auth/context";
import { isMarketplaceBuyer } from "@/lib/auth/shared";
import { useCart } from "@/lib/cart/context";
import { useI18n } from "@/lib/i18n/context";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { calculateDeliveryFee } from "@/lib/logistics/pricing";
import { Card, CardContent } from "@/components/ui/card";

export default function CartPage() {
  const { t } = useI18n();
  const { user, deliveryZone } = useAuth();
  const {
    items,
    subtotal,
    updateQty,
    removeItem,
    mode,
    isHydrating,
    isSyncing,
    syncError,
    accountSyncAvailable,
    refresh,
  } = useCart();

  const groups = useMemo(() => {
    const byShop = new Map<string, (typeof items)[0][]>();
    items.forEach((item) => {
      const group = byShop.get(item.shop_id) ?? [];
      group.push(item);
      byShop.set(item.shop_id, group);
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

  const total = subtotal + deliveryTotal;
  const buyerOk = isMarketplaceBuyer(user);

  const cartStatus =
    !buyerOk
      ? {
          badge: user ? "Buyers only" : "Sign in required",
          tone: "bg-amber-100 text-amber-900",
          text: user
            ? "Marketplace shopping and checkout are limited to buyer accounts."
            : "Sign in with a buyer account to use the cart and sync it across devices.",
        }
      : mode === "account"
        ? {
            badge: "Saved to account",
            tone: "bg-emerald-100 text-emerald-900",
            text: "These cart items are linked to your buyer account and will stay available after refresh.",
          }
        : syncError
          ? {
              badge: "Sync issue",
              tone: "bg-amber-100 text-amber-900",
              text: `${syncError} Try retry sync after signing in as a buyer.`,
            }
          : {
              badge: "Waiting for sync",
              tone: "bg-neutral-100 text-neutral-700",
              text: "Cart sync should start automatically for buyer accounts with Supabase enabled.",
            };

  if (isHydrating && !items.length) {
    return (
      <main className="mx-auto max-w-[1440px] px-4 py-16">
        <Card>
          <CardContent className="py-12 text-center text-sm text-neutral-500">
            Loading your saved cart...
          </CardContent>
        </Card>
      </main>
    );
  }

  if (!items.length) {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <Card className="border-dashed border-neutral-300 bg-neutral-50/80">
          <CardContent className="flex flex-col items-center gap-4 py-12 text-center">
            <Badge className={cartStatus.tone} variant="outline">
              {cartStatus.badge}
            </Badge>
            <div>
              <h1 className="text-2xl font-bold text-[#1E1B4B]">{t("yourCart")}</h1>
              <p className="mt-2 text-neutral-600">{t("emptyCart")}</p>
              <p className="mt-2 text-sm text-neutral-500">{cartStatus.text}</p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
              <LinkButton href="/products" className="bg-[#4F46E5]">
                {t("explore")}
              </LinkButton>
              {!user && accountSyncAvailable ? (
                <LinkButton href="/auth" variant="outline">
                  Sign in as a buyer
                </LinkButton>
              ) : null}
              {buyerOk && user && syncError ? (
                <Button type="button" variant="outline" onClick={() => void refresh()}>
                  Retry account sync
                </Button>
              ) : null}
              {user && !buyerOk ? (
                <LinkButton href="/auth" variant="outline">
                  Use a buyer account
                </LinkButton>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-[1440px] px-3 py-6 md:px-6">
      <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1E1B4B]">{t("yourCart")}</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Review collected items, update quantities, and confirm how this cart is being saved.
          </p>
        </div>
        <Card className="md:max-w-md">
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge className={cartStatus.tone} variant="outline">
                {cartStatus.badge}
              </Badge>
              {isSyncing ? (
                <Badge variant="outline">Syncing changes...</Badge>
              ) : null}
            </div>
            <p className="text-sm text-neutral-600">{cartStatus.text}</p>
            <div className="flex flex-wrap gap-2">
              {!user && accountSyncAvailable ? (
                <LinkButton href="/auth" variant="outline" size="sm">
                  Sign in as a buyer
                </LinkButton>
              ) : null}
              {buyerOk && user && syncError ? (
                <Button type="button" variant="outline" size="sm" onClick={() => void refresh()}>
                  Retry sync
                </Button>
              ) : null}
              {user && !buyerOk ? (
                <LinkButton href="/auth" variant="outline" size="sm">
                  Switch to buyer
                </LinkButton>
              ) : null}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-8 lg:flex-row">
        <div className="min-w-0 flex-1 space-y-4">
          {groups.map((group) => (
            <Card key={group.shopId}>
              <CardContent className="space-y-4 p-4">
                <div className="flex flex-col gap-2 border-b border-neutral-200 pb-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="font-semibold text-[#1E1B4B]">{group.shopName}</p>
                    <p className="mt-1 text-sm text-neutral-500">
                      Delivery to {deliveryZone.replace(/_/g, " ")}
                    </p>
                  </div>
                  <Badge variant="outline">
                    Delivery {group.delivery.toLocaleString()} ETB
                  </Badge>
                </div>

                {group.items.map((it) => {
                  const p = it.product;
                  if (!p) {
                    return (
                      <div
                        key={it.product_id}
                        className="flex items-center justify-between gap-4 rounded-lg border border-neutral-200 p-4"
                      >
                        <div>
                          <p className="font-medium text-neutral-900">Unavailable product</p>
                          <p className="mt-1 text-sm text-neutral-500">
                            This item was added before the live catalog was connected.
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          className="text-red-600"
                          onClick={() => removeItem(it.product_id)}
                        >
                          Remove
                        </Button>
                      </div>
                    );
                  }

                  const img = p.images[0];
                  return (
                    <div
                      key={it.product_id}
                      className="flex gap-4 rounded-lg border border-neutral-200 p-4"
                    >
                      <Link
                        href={`/products/${p.id}`}
                        className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-neutral-100"
                      >
                        {img ? (
                          <Image src={img} alt={p.name} fill className="object-cover" />
                        ) : null}
                      </Link>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <Link
                              href={`/products/${p.id}`}
                              className="font-medium hover:text-[#4F46E5]"
                            >
                              {p.name}
                            </Link>
                            <p className="mt-1 text-sm text-neutral-500">{p.shop?.name}</p>
                            <p className="mt-2 text-sm text-neutral-600">
                              Unit price{" "}
                              <span className="font-semibold text-[#4F46E5]">
                                {it.price_at_add.toLocaleString()} ETB
                              </span>
                            </p>
                          </div>
                          <p className="text-sm font-semibold text-[#1E1B4B]">
                            {(it.price_at_add * it.quantity).toLocaleString()} ETB
                          </p>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-3">
                          <div className="flex items-center rounded-md border border-neutral-200">
                            <button
                              type="button"
                              className="px-2 py-1"
                              onClick={() => updateQty(it.product_id, it.quantity - 1)}
                            >
                              −
                            </button>
                            <span className="min-w-6 text-center text-sm">{it.quantity}</span>
                            <button
                              type="button"
                              className="px-2 py-1"
                              onClick={() => updateQty(it.product_id, it.quantity + 1)}
                            >
                              +
                            </button>
                          </div>
                          <Button
                            variant="ghost"
                            className="text-red-600"
                            onClick={() => removeItem(it.product_id)}
                          >
                            Remove
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          ))}
        </div>
        <aside className="lg:w-80">
          <Card className="lg:sticky lg:top-24">
            <CardContent className="space-y-4 p-4">
              <div>
                <p className="font-semibold text-[#1E1B4B]">Checkout summary</p>
                <p className="mt-1 text-sm text-neutral-600">
                  {buyerOk && mode === "account"
                    ? "Checkout will use the items saved to your buyer account."
                    : "You need a signed-in buyer with a synced cart before you can pay."}
                </p>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("subtotal")}</span>
                <span className="font-medium">
                  {subtotal.toLocaleString()} ETB
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>{t("delivery")}</span>
                <span className="font-medium">
                  {deliveryTotal.toLocaleString()} ETB
                </span>
              </div>
              <Separator />
              <div className="flex justify-between font-semibold">
                <span>{t("total")}</span>
                <span>{total.toLocaleString()} ETB</span>
              </div>
              <Separator />
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Cart lines</span>
                  <span className="font-medium">{items.length}</span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-neutral-600">Delivery groups</span>
                  <span className="font-medium">{groups.length}</span>
                </div>
              </div>
              {buyerOk && mode === "account" && !syncError ? (
                <LinkButton
                  href="/checkout"
                  className="w-full bg-amber-500 font-semibold text-neutral-900 hover:bg-amber-400"
                >
                  {t("proceedCheckout")}
                </LinkButton>
              ) : (
                <LinkButton
                  href={!user ? "/auth" : !buyerOk ? "/auth" : "/account"}
                  variant="outline"
                  className="w-full border-amber-500 font-semibold text-amber-900"
                >
                  {!user
                    ? "Sign in to check out"
                    : !buyerOk
                      ? "Buyer account required"
                      : "Fix cart sync to check out"}
                </LinkButton>
              )}
              <LinkButton href="/products" variant="outline" className="w-full">
                Continue shopping
              </LinkButton>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
