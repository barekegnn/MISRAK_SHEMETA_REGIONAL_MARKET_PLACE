"use client";

import { BROWSE_HUB_PARAMS, type BrowseHubParam } from "@/lib/browse-hubs";
import { Button } from "@/components/ui/button";
import { useLocale } from "@/components/providers/locale-provider";
import { cn } from "@/lib/utils";

export function CityHubChips({
  active,
  onSelect,
}: {
  active: BrowseHubParam;
  onSelect: (hub: BrowseHubParam) => void;
}) {
  const { t } = useLocale();

  return (
    <div className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] md:flex-wrap md:overflow-visible [&::-webkit-scrollbar]:hidden">
      {BROWSE_HUB_PARAMS.map((hub) => {
        const label =
          hub === "all"
            ? t("shops.hub.all")
            : t(`shops.hub.${hub}` as "shops.hub.Harar");
        const isActive = active === hub;
        return (
          <Button
            key={hub}
            type="button"
            size="sm"
            variant={isActive ? "default" : "outline"}
            onClick={() => onSelect(hub)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-xs font-semibold shadow-sm transition-all md:text-sm",
              isActive && "ring-2 ring-brand-400/60 ring-offset-2 ring-offset-brand-50/50"
            )}
          >
            {label}
          </Button>
        );
      })}
    </div>
  );
}
