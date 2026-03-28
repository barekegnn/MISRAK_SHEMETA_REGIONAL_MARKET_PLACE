import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export type BrowseTrailItem = {
  href?: string;
  label: string;
  current?: boolean;
};

export function BrowseTrail({
  items,
  className,
  variant = "standard",
}: {
  items: BrowseTrailItem[];
  className?: string;
  variant?: "standard" | "premium";
}) {
  if (!items.length) return null;
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn(
        variant === "premium"
          ? "rounded-2xl border border-brand-100/80 bg-white/70 px-3 py-2.5 shadow-sm backdrop-blur-sm md:px-4"
          : "py-1",
        className
      )}
    >
      <ol className="flex flex-wrap items-center gap-x-1 gap-y-1 text-xs font-medium md:text-sm">
        {items.map((item, i) => (
          <li key={i} className="flex min-w-0 max-w-full items-center gap-1">
            {i > 0 && (
              <ChevronRight
                className="h-3.5 w-3.5 shrink-0 text-brand-300"
                aria-hidden
                strokeWidth={2.5}
              />
            )}
            {item.href && !item.current ? (
              <Link
                href={item.href}
                className={cn(
                  "truncate text-brand-600 transition-colors hover:text-brand-900 hover:underline",
                  variant === "premium" && "rounded-lg px-1.5 py-0.5 hover:bg-brand-50 hover:no-underline"
                )}
              >
                {item.label}
              </Link>
            ) : (
              <span
                className={cn(
                  "truncate",
                  item.current
                    ? "font-semibold text-brand-950"
                    : "text-brand-600"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
