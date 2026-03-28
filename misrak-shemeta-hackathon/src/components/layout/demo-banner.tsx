"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function DemoBanner() {
  const { t } = useLocale();
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="sticky top-0 z-[60] flex min-h-10 items-center justify-center border-b border-white/10 bg-brand-900 px-4 py-2 text-center text-xs font-medium text-white/95 sm:text-sm"
    >
      <span className="max-w-3xl leading-snug">
        <span aria-hidden className="mr-1.5 opacity-80">
          ·
        </span>
        {t("demoBanner")}
      </span>
    </div>
  );
}
