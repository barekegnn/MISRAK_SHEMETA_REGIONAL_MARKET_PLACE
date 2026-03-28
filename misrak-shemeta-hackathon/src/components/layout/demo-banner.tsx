"use client";

import { useLocale } from "@/components/providers/locale-provider";

export function DemoBanner() {
  const { t } = useLocale();
  if (process.env.NEXT_PUBLIC_DEMO_MODE !== "true") return null;

  return (
    <div
      role="status"
      className="sticky top-0 z-[60] border-b border-brand-200 bg-gradient-to-r from-brand-500 via-brand-600 to-accent-500 px-4 py-2 text-center text-sm font-medium text-white shadow-md"
    >
      🧪 {t("demoBanner")}
    </div>
  );
}
