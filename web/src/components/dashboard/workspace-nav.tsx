"use client";

import { usePathname } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { LinkButton } from "@/components/ui/link-button";
import { getRoleLabel, getWorkspaceNavItems } from "@/lib/auth/shared";
import type { UserRole } from "@/types";
import { cn } from "@/lib/utils";

type Props = {
  role: UserRole;
  className?: string;
};

export function WorkspaceNav({ role, className }: Props) {
  const pathname = usePathname();
  const items = getWorkspaceNavItems(role);
  const activeHref = getActiveHref(items.map((item) => item.href), pathname);

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
            {getRoleLabel(role)} workspace
          </p>
          <p className="mt-1 text-sm text-neutral-600">
            Move between your overview, operational pages, and account settings.
          </p>
        </div>
        <Badge variant="outline">Role: {getRoleLabel(role)}</Badge>
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
              {item.label}
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
