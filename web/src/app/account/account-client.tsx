"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DashboardShell, SectionCard } from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { getDashboardRoute } from "@/lib/auth/shared";
import type { DeliveryZone, Language, User } from "@/types";
import { DELIVERY_ZONES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";
import {
  translateDeliveryZone,
  translateRole,
} from "@/lib/i18n/labels";

type Props = { user: User };

export function AccountClient({ user: initialUser }: Props) {
  const router = useRouter();
  const { user, signOut, deliveryZone, profileLanguage, refresh } = useAuth();
  const { t, setLang } = useI18n();

  const u = user ?? initialUser;
  const dashboardHref = getDashboardRoute(u.role);
  const zoneValue = deliveryZone ?? u.delivery_zone ?? "Haramaya_Campus";
  const zoneLabel = translateDeliveryZone(zoneValue, t);
  const [fullName, setFullName] = useState(u.full_name ?? "");
  const [phone, setPhone] = useState(u.phone ?? "");
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(
    deliveryZone ?? u.delivery_zone ?? "Haramaya_Campus",
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(profileLanguage);
  const [saving, setSaving] = useState(false);

  async function handleSignOut() {
    await signOut();
    router.push("/");
    router.refresh();
  }

  async function saveProfile() {
    setSaving(true);
    try {
      const response = await fetch("/api/account/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fullName,
          phone,
          deliveryZone: selectedZone,
          language: selectedLanguage,
        }),
      });
      const payload = (await response.json()) as { message?: string; error?: string };

      if (!response.ok) {
        throw new Error(payload.error ?? t("account_toast_error"));
      }

      setLang(selectedLanguage);
      await refresh();
      router.refresh();
      toast.success(payload.message ?? t("account_toast_saved"));
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : t("account_toast_error"),
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      eyebrow={t("account_eyebrow")}
      title={t("account_title")}
      description={t("account_description")}
      actions={
        <>
          {u.role === "buyer" ? (
            <LinkButton href="/orders" className="bg-[#4F46E5] hover:bg-[#4338CA]">
              {t("orders")}
            </LinkButton>
          ) : null}
          <LinkButton href="/" variant="outline">
            {t("account_marketplace")}
          </LinkButton>
          <LinkButton href={dashboardHref} variant="outline">
            {t("account_openDashboard")}
          </LinkButton>
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => void handleSignOut()}
          >
            {t("signOut")}
          </Button>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_minmax(0,0.9fr)]">
        <SectionCard
          title={t("account_profileSummary")}
          description={t("account_profileSummaryDesc")}
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock
              label={t("account_label_name")}
              value={u.full_name ?? t("account_notSet")}
            />
            <InfoBlock label={t("account_label_email")} value={u.email} />
            <InfoBlock
              label={t("account_label_role")}
              value={translateRole(u.role, t)}
            />
            <InfoBlock
              label={t("account_label_phone")}
              value={u.phone ?? t("account_notSet")}
            />
            <InfoBlock label={t("account_label_zone")} value={zoneLabel} />
            <InfoBlock
              label={t("account_label_language")}
              value={
                profileLanguage === "en"
                  ? t("auth_lang_en")
                  : profileLanguage === "am"
                    ? t("auth_lang_am")
                    : t("auth_lang_om")
              }
            />
            <InfoBlock
              label={t("account_label_memberSince")}
              value={new Date(u.created_at).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            />
          </div>
        </SectionCard>

        <SectionCard
          title={t("account_updateTitle")}
          description={t("account_updateDesc")}
          action={
            <Button type="button" onClick={() => void saveProfile()} disabled={saving}>
              {saving ? t("account_saving") : t("account_saveChanges")}
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-full-name">{t("account_fullName")}</Label>
              <Input
                id="account-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Marketplace Buyer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-phone">{t("account_label_phone")}</Label>
              <Input
                id="account-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+2519XXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-zone">{t("account_label_zone")}</Label>
              <select
                id="account-zone"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedZone}
                onChange={(event) => setSelectedZone(event.target.value as DeliveryZone)}
              >
                {DELIVERY_ZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {translateDeliveryZone(zone.value, t)}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-language">{t("account_label_language")}</Label>
              <select
                id="account-language"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value as Language)}
              >
                <option value="en">{t("auth_lang_en")}</option>
                <option value="am">{t("auth_lang_am")}</option>
                <option value="om">{t("auth_lang_om")}</option>
              </select>
            </div>

            <p className="text-xs text-neutral-500">
              {t("account_passwordHintPrefix")}{" "}
              <Link
                href="/auth"
                className="font-medium text-[#4F46E5] underline underline-offset-2 hover:text-[#4338CA]"
              >
                {t("signIn")}
              </Link>{" "}
              {t("account_passwordHintSuffix")}
            </p>
          </div>
        </SectionCard>
      </div>

      <SectionCard
        title={t("account_sessionTitle")}
        description={t("account_sessionDesc")}
        action={
          <Button
            type="button"
            variant="outline"
            className="border-red-200 text-red-700 hover:bg-red-50"
            onClick={() => void handleSignOut()}
          >
            {t("signOut")}
          </Button>
        }
      >
        <p className="text-sm text-neutral-600">{t("account_sessionBody")}</p>
      </SectionCard>
    </DashboardShell>
  );
}

function InfoBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-neutral-50 p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-neutral-500">{label}</p>
      <p className="mt-2 font-medium text-neutral-900">{value}</p>
    </div>
  );
}
