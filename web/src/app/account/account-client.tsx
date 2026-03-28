"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  DashboardShell,
  SectionCard,
  formatLabel,
} from "@/components/dashboard/dashboard-ui";
import { Button } from "@/components/ui/button";
import { LinkButton } from "@/components/ui/link-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth/context";
import { getDashboardRoute, getRoleLabel } from "@/lib/auth/shared";
import type { DeliveryZone, Language, User } from "@/types";
import { DELIVERY_ZONES } from "@/lib/constants";
import { useI18n } from "@/lib/i18n/context";

type Props = { user: User };

export function AccountClient({ user: initialUser }: Props) {
  const router = useRouter();
  const { user, signOut, deliveryZone, profileLanguage, refresh } = useAuth();
  const { t, setLang } = useI18n();

  const u = user ?? initialUser;
  const dashboardHref = getDashboardRoute(u.role);
  const zoneLabel =
    DELIVERY_ZONES.find((z) => z.value === (deliveryZone ?? u.delivery_zone))?.label ??
    formatLabel(deliveryZone ?? u.delivery_zone);
  const [fullName, setFullName] = useState(u.full_name ?? "");
  const [phone, setPhone] = useState(u.phone ?? "");
  const [selectedZone, setSelectedZone] = useState<DeliveryZone>(
    deliveryZone ?? u.delivery_zone ?? "Haramaya_Campus",
  );
  const [selectedLanguage, setSelectedLanguage] = useState<Language>(profileLanguage);
  const [saving, setSaving] = useState(false);

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
        throw new Error(payload.error ?? "Unable to save account settings.");
      }

      setLang(selectedLanguage);
      await refresh();
      router.refresh();
      toast.success(payload.message ?? "Account settings saved.");
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unable to save account settings.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <DashboardShell
      eyebrow="Personal settings"
      title="Account"
      description="Review your profile, keep delivery preferences in sync, and jump back into your role workspace."
      actions={
        <>
          {u.role === "buyer" ? (
            <LinkButton href="/orders" className="bg-[#4F46E5] hover:bg-[#4338CA]">
              {t("orders")}
            </LinkButton>
          ) : null}
          <LinkButton href={dashboardHref} variant="outline">
            Open dashboard
          </LinkButton>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[1.1fr_minmax(0,0.9fr)]">
        <SectionCard
          title="Profile summary"
          description="The current signed-in account details, role, and joined date."
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <InfoBlock label="Name" value={u.full_name ?? "Not set yet"} />
            <InfoBlock label="Email" value={u.email} />
            <InfoBlock label="Role" value={getRoleLabel(u.role)} />
            <InfoBlock label="Phone" value={u.phone ?? "Not set yet"} />
            <InfoBlock label="Delivery zone" value={zoneLabel} />
            <InfoBlock label="Language" value={profileLanguage.toUpperCase()} />
            <InfoBlock
              label="Member since"
              value={new Date(u.created_at).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            />
          </div>
        </SectionCard>

        <SectionCard
          title="Update account settings"
          description="Save the settings that should follow this signed-in account across checkout, dashboards, and fulfillment."
          action={
            <Button type="button" onClick={() => void saveProfile()} disabled={saving}>
              {saving ? "Saving..." : "Save changes"}
            </Button>
          }
        >
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="account-full-name">Full name</Label>
              <Input
                id="account-full-name"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                placeholder="Marketplace Buyer"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-phone">Phone</Label>
              <Input
                id="account-phone"
                value={phone}
                onChange={(event) => setPhone(event.target.value)}
                placeholder="+2519XXXXXXXX"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-zone">Delivery zone</Label>
              <select
                id="account-zone"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedZone}
                onChange={(event) => setSelectedZone(event.target.value as DeliveryZone)}
              >
                {DELIVERY_ZONES.map((zone) => (
                  <option key={zone.value} value={zone.value}>
                    {zone.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="account-language">Language</Label>
              <select
                id="account-language"
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={selectedLanguage}
                onChange={(event) => setSelectedLanguage(event.target.value as Language)}
              >
                <option value="en">English</option>
                <option value="am">Amharic</option>
                <option value="om">Afaan Oromo</option>
              </select>
            </div>

            <div className="flex flex-col gap-3 pt-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => void signOut()}
              >
                {t("signOut")}
              </Button>
            </div>
          </div>
        </SectionCard>
      </div>
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
