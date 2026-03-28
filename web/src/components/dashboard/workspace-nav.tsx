"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { getWorkspaceNavItems } from "@/lib/auth/shared";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";
import { WorkspaceSessionActions } from "@/components/dashboard/workspace-session-actions";
import { useI18n } from "@/lib/i18n/context";
import {
  translateRole,
  translateWorkspaceNavLabel,
} from "@/lib/i18n/labels";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";

type Props = {
  role: UserRole;
  className?: string;
};

export function WorkspaceNav({ role, className }: Props) {
  const pathname = usePathname();
  const { t } = useI18n();
  const items = getWorkspaceNavItems(role);
  const activeHref = getActiveHref(items.map((item) => item.href), pathname);
  const roleLabel = translateRole(role, t);

  return (
    <div
      className={cn(
        "rounded-2xl border border-neutral-200 bg-white px-4 py-4 shadow-sm",
        className,
      )}
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-[#4F46E5]">
            {t("workspace_title", { role: roleLabel })}
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            {t("workspace_blurb")}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <LanguageSwitcher variant="onLight" />
          <Badge variant="outline">
            {t("roleBadge", { role: roleLabel })}
          </Badge>
          <WorkspaceSessionActions />
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {items.map((item) => {
          const active = item.href === activeHref;
          return (
            <LinkButton
              key={item.href}
              href={item.href}
              variant={active ? "default" : "outline"}
              size="sm"
              className={active ? "bg-[#4F46E5] hover:bg-[#4338CA]" : undefined}
            >
              {translateWorkspaceNavLabel(item.href, t)}
            </LinkButton>
          );
        })}
      </div>
    </div>
  );
}

function getActiveHref(items: string[], pathname: string) {
  return (
    [...items]
      .sort((left, right) => right.length - left.length)
      .find((href) => pathname === href || pathname.startsWith(`${href}/`)) ?? null
  );
}
