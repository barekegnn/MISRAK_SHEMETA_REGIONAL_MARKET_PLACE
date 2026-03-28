"use client";

import { useAuth } from "@/components/providers/auth-provider";
import { useLocale } from "@/components/providers/locale-provider";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { updateBuyerProfile } from "@/app/actions/profile";
import type { DeliveryZone } from "@/types";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useState } from "react";

const ZONES: DeliveryZone[] = [
  "Haramaya_Campus",
  "Haramaya_Town",
  "Harar_Campus",
  "Harar_City",
  "DDU",
  "Dire_Dawa_City",
  "Aweday_Town",
];

export function CampusSelector() {
  const { profile, refreshProfile } = useAuth();
  const { t, locale } = useLocale();
  const [saving, setSaving] = useState(false);

  const mustSelect =
    profile?.role === "buyer" && profile.delivery_zone == null && !!profile.id;

  if (!profile || profile.role !== "buyer") return null;

  async function pick(zone: DeliveryZone) {
    setSaving(true);
    try {
      await updateBuyerProfile({
        delivery_zone: zone,
        language: locale,
      });
      await refreshProfile();
      toast.success(t("onboarding.save"));
    } catch {
      toast.error(t("common.error"));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={mustSelect} modal>
      <DialogContent
        className="max-h-[90vh] overflow-y-auto"
        onPointerDownOutside={(e) => e.preventDefault()}
        onEscapeKeyDown={(e) => e.preventDefault()}
      >
        <DialogTitle className="font-display text-xl">
          {t("onboarding.title")}
        </DialogTitle>
        <DialogDescription>{t("onboarding.subtitle")}</DialogDescription>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          {ZONES.map((z) => (
            <Button
              key={z}
              type="button"
              variant="secondary"
              className="h-auto min-h-12 justify-start whitespace-normal px-4 py-3 text-left text-sm"
              disabled={saving}
              onClick={() => void pick(z)}
            >
              {t(`onboarding.zones.${z}` as "onboarding.zones.Harar_City")}
            </Button>
          ))}
        </div>
        {saving && (
          <div className="flex items-center gap-2 text-sm text-brand-600">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("common.loading")}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
